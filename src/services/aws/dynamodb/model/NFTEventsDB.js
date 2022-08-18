const {PutItemCommand, GetItemCommand} = require("@aws-sdk/client-dynamodb");
const DynamoEntity = require("./dinamoEntity");

module.exports = class NFTEventsDB extends DynamoEntity {
  constructor() {
    super("NFTEvents", {
      KeySchema: [{AttributeName: "transactionHash", KeyType: "HASH"}],
      AttributeDefinitions: [
        {AttributeName: "transactionHash", AttributeType: "S"},
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    });
  }

  /**
   * Fetch an event with specific identifier from the DynamoDB table.
   *
   * @param {*} dbclient connection to dynaomoDB
   * @param {*} id event ID to be fetched
   */
  async get(dbclient, id) {
    if (!dbclient) throw new Error(`dbclient is required`);
    if (!id) throw new Error(`ID is required`);
    try {
      return await dbclient.send(
        new GetItemCommand({
          TableName: this.TableName,
          Key: {
            transactionHash: {S: id},
          },
          ProjectionExpression: "blockNumber,from,to,tokenId",
        })
      );
    } catch (e) {
      console.error(e.message, e.stack);
    }
  }

  /**
   * Persist {event} at the DynamoDB table.
   *
   * @param {*} dbclient connection to dynaomoDB
   * @param {*} event event to be persisted
   */
  async save(dbclient, event) {
    if (!dbclient) throw new Error(`dbclient is required`);
    if (!event) throw new Error(`Event is required`);
    try {
      await dbclient.send(
        new PutItemCommand({
          TableName: this.TableName,
          Item: {
            transactionHash: {S: event.transactionHash},
            blockNumber: {N: event.blockNumber},
            from: {S: event.args.from},
            to: {S: event.args.to},
            tokenId: {S: event.args.tokenId.toString()},
          },
        })
      );
    } catch (e) {
      console.error(e.message, e.stack);
    }
  }
};
