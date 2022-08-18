const {ScanCommand} = require("@aws-sdk/client-dynamodb");
const {unmarshall} = require("@aws-sdk/util-dynamodb");

module.exports = class DinamoEntity {
  constructor(tableName, createTableCommandInput) {
    this.TableName = tableName;
    this.CreateTableCommandInput = createTableCommandInput;
    this.CreateTableCommandInput.TableName = tableName;
  }

  get(dbclient, id) {
    throw new Error("Method not implemented.");
  }

  /**
   * Fetch all events from the DynamoDB table.
   * @dev https://github.com/aws/aws-sdk-js-v3/tree/main/lib/lib-dynamodb
   *
   * @param {*} dbclient connection to dynaomoDB
   */
  async getAll(dbclient) {
    if (!dbclient) throw new Error(`dbclient is required`);
    try {
      const result = await dbclient.send(
        new ScanCommand({
          TableName: this.TableName,
          // como 'from' e 'to' são palavras reservadas no DynamoDB, eles precisam ser
          // receber um outro nome com prefixo '#' no ProjectionExpression e, no ExpressionAttributeNames,
          // faz-se o mapeamento com o nome original da coluna ('from' e 'to')
          ProjectionExpression: "blockNumber, #from, #to, tokenId",
          ExpressionAttributeNames: {
            "#from": "from",
            "#to": "to",
          },
        })
      );
      return result.Items.map((Item) => unmarshall(Item));
    } catch (e) {
      console.error(e.message, e.stack);
    }
  }

  save(dbclient, entity) {
    throw new Error("Method not implemented.");
  }
};
