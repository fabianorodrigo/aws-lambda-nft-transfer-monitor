const {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
} = require("@aws-sdk/client-dynamodb");

module.exports = async function connect(dynamoEntity, endPointURL) {
  if (!dynamoEntity) throw new Error(`Dynamo Entity is required`);

  // If process.env.DYNAMODB_ENDPOINT exists, then use it to connect to DynamoDB.
  const dbclient = new DynamoDBClient(
    endPointURL ? {endpoint: process.env.DYNAMODB_ENDPOINT} : {}
  );

  try {
    if (Array.isArray(dynamoEntity)) {
      for (let i = 0; i < dynamoEntity.length; i++) {
        await createTable(dbclient, dynamoEntity[i]);
      }
    } else {
      await createTable(dbclient, dynamoEntity);
    }
  } catch (err) {
    console.error(err);
  }
  return dbclient;
};

async function createTable(dbclient, dynamoEntity) {
  if (!dynamoEntity.TableName) {
    throw new Error(`Dynamo Entity with its TableName is required`);
  }
  const listResult = await dbclient.send(new ListTablesCommand({}));
  if (!listResult.TableNames.includes(dynamoEntity.TableName)) {
    if (!dynamoEntity.CreateTableCommandInput)
      throw new Error(
        `Dynamo Entity with its CreateTableCommandInput is required`
      );
    const createResult = await dbclient.send(
      new CreateTableCommand(dynamoEntity.CreateTableCommandInput)
    );
  }
}
