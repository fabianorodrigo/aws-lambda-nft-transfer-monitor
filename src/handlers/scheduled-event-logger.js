const dotenv = require("dotenv");
dotenv.config();

const NFTEventsDB = require("../services/aws/dynamodb/model/NFTEventsDB");
const connect = require("../services/aws/dynamodb/connection");
const getContract = require("../services/getContract");

/**
 * A Lambda function that logs the payload received from a CloudWatch scheduled event.
 */
exports.scheduledEventLoggerHandler = async (event, context) => {
  const nftEventsDB = new NFTEventsDB();
  // If process.env.DYNAMODB_ENDPOINT exists, then use it to connect to DynamoDB.
  const dbclient = await connect(nftEventsDB, process.env.DYNAMODB_ENDPOINT);

  const contract = getContract();
  const filter = contract.filters.Transfer();
  const FROM_BLOCK = parseInt(process.env.FROM_BLOCK);
  const transferEvents = await contract.queryFilter(
    filter,
    FROM_BLOCK,
    "latest"
  );

  for (let i = 0; i < transferEvents.length; i++) {
    await nftEventsDB.save(dbclient, transferEvents[i]);
    console.log(`Persisted successfully: ${transferEvents[i].transactionHash}`);
  }

  // All log statements are written to CloudWatch by default. For more information, see
  // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html
  console.info(JSON.stringify(event));
};
