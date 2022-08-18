// Import all functions from scheduled-event-logger.js
const shelljs = require("shelljs");
const scheduledEventLogger = require("../../../src/handlers/scheduled-event-logger");
const NFTEventsDB = require("../../../src/services/aws/dynamodb/model/NFTEventsDB");
const connect = require("../../../src/services/aws/dynamodb/connection");

describe("Test for Scheduled NFT Transfer Event Detection", function () {
  let nftEventsDB;
  let dbclient;

  beforeAll(async function () {
    // run docker amazon/dynamodb-local detached and with automatic container removal
    console.log(
      shelljs.exec(
        "docker run -d --rm --name dynamoLocal amazon/dynamodb-local",
        {
          silent: true,
        }
      ).stdout
    );
    // wait for docker to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
    nftEventsDB = new NFTEventsDB();
    // If process.env.DYNAMODB_ENDPOINT exists, then use it to connect to DynamoDB.
    dbclient = await connect(nftEventsDB, process.env.DYNAMODB_ENDPOINT);
  });
  afterAll(async function () {
    // run docker amazon/dynamodb-local
    shelljs.exec("docker stop dynamoLocal", {
      silent: true,
    });
  });
  // This test invokes the scheduled-event-logger Lambda function and verifies that the received payload is logged
  it("Verifies the payload is logged", async (done) => {
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

    // At first invocation, the DynamoDB table is empty.
    let allEvents = await nftEventsDB.getAll(dbclient);
    expect(allEvents.length).toBe(0);

    await scheduledEventLogger.scheduledEventLoggerHandler(payload, null);

    // At first invocation, the DynamoDB table is empty.
    allEvents = await nftEventsDB.getAll(dbclient);
    expect(allEvents.length).toBe(2);

    // Verify that console.info has been called with the expected payload
    //expect(console.info).toHaveBeenCalledWith(JSON.stringify(payload));

    done();
  });
});
