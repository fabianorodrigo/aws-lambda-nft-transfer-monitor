// Import all functions from scheduled-event-logger.js
const shelljs = require("shelljs");
const scheduledEventLogger = require("../../../src/handlers/scheduled-event-logger");
const NFTEventsDB = require("../../../src/services/aws/dynamodb/model/NFTEventsDB");
const ParametersDB = require("../../../src/services/aws/dynamodb/model/ParametersDB");
const connect = require("../../../src/services/aws/dynamodb/connection");

describe("Test for Scheduled NFT Transfer Event Detection", function () {
  let nftEventsDB;
  let parametersDB;
  let dbclient;
  let lastBlockCheckedFinal;

  beforeAll(async function () {
    nftEventsDB = new NFTEventsDB();
    parametersDB = new ParametersDB();
    // If process.env.DYNAMODB_ENDPOINT exists, then use it to connect to DynamoDB.
    dbclient = await connect(
      [parametersDB, nftEventsDB],
      process.env.DYNAMODB_ENDPOINT
    );
  });

  // This test invokes the scheduled-event-logger Lambda function and verifies that the events were inserted into DynamoDb tabble
  it("Should insert events into DynamoDB at the first time ", async () => {
    // Mock console.log statements so we can verify them. For more information, see
    // https://jestjs.io/docs/en/mock-functions.html
    //console.info = jest.fn();

    // Create a sample payload with CloudWatch scheduled event message format
    var payload = {
      id: "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
      "detail-type": "Scheduled Event",
      source: "aws.events",
      account: "",
      time: "1970-01-01T00:00:00Z",
      region: "us-west-2",
      resources: ["arn:aws:events:us-west-2:123456789012:rule/ExampleRule"],
      detail: {},
    };

    // expect params does not exist;
    expect(await parametersDB.get(dbclient, "lastBlockChecked")).toBeNull();

    // At first invocation, the DynamoDB table is empty.
    let allEvents = await nftEventsDB.getAll(dbclient);
    expect(allEvents.length).toBe(0);

    await scheduledEventLogger.scheduledEventLoggerHandler(payload, null);

    // At first invocation, the DynamoDB table is empty.
    allEvents = await nftEventsDB.getAll(dbclient);

    expect(allEvents.length).toBe(2);

    lastBlockCheckedFinal = await parametersDB.get(
      dbclient,
      "lastBlockChecked"
    );
    // expect params does not exist
    expect(lastBlockCheckedFinal).not.toEqual(null);

    // Verify that console.info has been called with the expected payload
    //expect(console.info).toHaveBeenCalledWith(JSON.stringify(payload));
  });
  it("Should not insert events into DynamoDB when there is no new events", async () => {
    // expect params is equal to the to the block number of the last event
    const lbc = await parametersDB.get(dbclient, "lastBlockChecked");
    expect(lbc.value).toBe(lastBlockCheckedFinal.value);

    await scheduledEventLogger.scheduledEventLoggerHandler({}, null);

    // expect params keeps being the block number of the last event
    const lbc2 = await parametersDB.get(dbclient, "lastBlockChecked");
    expect(lbc2.value).toBe(lastBlockCheckedFinal.value);
  });
});
