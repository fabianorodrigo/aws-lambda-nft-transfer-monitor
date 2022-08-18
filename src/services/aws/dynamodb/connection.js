const {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
} = require("@aws-sdk/client-dynamodb");

module.exports = async function connect(dynamoEntity, endPointURL) {
  if (!dynamoEntity) throw new Error(`Dynamo Entity is required`);
  if (!dynamoEntity.TableName)
    throw new Error(`Dynamo Entity with its TableName is required`);

  // If process.env.DYNAMODB_ENDPOINT exists, then use it to connect to DynamoDB.
  const dbclient = new DynamoDBClient(
    endPointURL ? {endpoint: process.env.DYNAMODB_ENDPOINT} : {}
  );

  try {
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
  } catch (err) {
    console.error(err);
  }
  return dbclient;
};
