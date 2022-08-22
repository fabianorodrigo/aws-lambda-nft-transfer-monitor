const dotenv = require("dotenv");
dotenv.config();

const NFTEventsDB = require("../services/aws/dynamodb/model/NFTEventsDB");
const ParametersDB = require("../services/aws/dynamodb/model/ParametersDB");
const connect = require("../services/aws/dynamodb/connection");
const getContract = require("../services/getContract");

/**
 * A Lambda function that logs the payload received from a CloudWatch scheduled event.
 */
exports.scheduledEventLoggerHandler = async (event, context) => {
  const nftEventsDB = new NFTEventsDB();
  const parametersDB = new ParametersDB();
  // If process.env.DYNAMODB_ENDPOINT exists, then use it to connect to DynamoDB.
  const dbclient = await connect(
    [parametersDB, nftEventsDB],
    process.env.DYNAMODB_ENDPOINT
  );

  //Defining at which block the search for events will start
  let lastBlock = await parametersDB.get(dbclient, "lastBlockChecked");
  if (lastBlock == null) {
    lastBlock = parseInt(process.env.FROM_BLOCK);
  }
  const FROM_BLOCK = lastBlock + 1;

  // Quering events
  const contract = getContract();
  const filter = contract.filters.Transfer();
  const transferEvents = await contract.queryFilter(
    filter,
    FROM_BLOCK,
    "latest"
  );

  for (let i = 0; i < transferEvents.length; i++) {
    await nftEventsDB.save(dbclient, transferEvents[i]);
    console.log(`Persisted successfully: ${transferEvents[i].transactionHash}`);
    if (transferEvents[i].blockNumber > lastBlock) {
      lastBlock = transferEvents[i].blockNumber;
    }
  }

  // Persist the last block checked
  await parametersDB.save(dbclient, "lastBlockChecked", lastBlock.toString());

  // All log statements are written to CloudWatch by default. For more information, see
  // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html
  //console.info(JSON.stringify(event));
};
