const {
  PutItemCommand,
  UpdateItemCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");
const DynamoEntity = require("./dinamoEntity");
const {unmarshall} = require("@aws-sdk/util-dynamodb");

module.exports = class ParametersDB extends DynamoEntity {
  constructor() {
    super("Parameters", {
      KeySchema: [{AttributeName: "name", KeyType: "HASH"}],
      AttributeDefinitions: [{AttributeName: "name", AttributeType: "S"}],
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
   * @param {*} name event ID to be fetched
   */
  async get(dbclient, name) {
    if (!dbclient) throw new Error(`dbclient is required`);
    if (!name) throw new Error(`Parameter name is required`);
    try {
      const result = await dbclient.send(
        new GetItemCommand({
          TableName: this.TableName,
          Key: {
            name: {S: name},
          },
        })
      );
      if (result?.Item) {
        return unmarshall(result.Item);
      }
    } catch (e) {
      console.error(e.message, e.stack);
    }
    return null;
  }

  /**
   * Persist parameter {value} with {name} at the DynamoDB table.
   *
   * @param {*} dbclient connection to dynaomoDB
   * @param {*} name parameter name to be persisted
   * @param {*} name parameter name to be persisted
   */
  async save(dbclient, name, value) {
    if (!dbclient) throw new Error(`dbclient is required`);
    if (!name) throw new Error(`Parameter name is required`);
    try {
      if ((await this.get(dbclient, name)) == null) {
        const putResult = await dbclient.send(
          new PutItemCommand({
            TableName: this.TableName,
            Item: {
              name: {S: name},
              value: {S: value},
            },
          })
        );
        // console.log("PutItemCommand Result: ", putResult);
      } else {
        const updtResult = await dbclient.send(
          new UpdateItemCommand({
            TableName: this.TableName,
            Key: {
              name: {S: name},
            },
            UpdateExpression: "set #value = :v",
            ExpressionAttributeNames: {
              "#value": "value",
            },
            ExpressionAttributeValues: {
              ":v": {S: value},
            },
            ReturnValues: "ALL_NEW",
          })
        );
        // console.log("UpdateItemCommand Result: ", updtResult);
      }
    } catch (e) {
      console.error(e.message, e.stack);
    }
  }
};
