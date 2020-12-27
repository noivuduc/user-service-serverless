import * as AWS from "aws-sdk";

const CONFIG_USERS_TABLE = process.env.CONFIG_USERS_TABLE;
const CONFIG_DYNAMODB_ENDPOINT = process.env.DYNAMOBD_URL;
const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDB;
if (IS_OFFLINE === 'true') {
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: CONFIG_DYNAMODB_ENDPOINT,
  });
} else {
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}



export async function massInsert(params) {
  return dynamoDB
    .batchWrite(params)
    .promise()
    .then(res => res)
    .catch(err => err);
}


export function searchUsers(query: string = '', LastEvaluatedKey: string, Limit = 100) {
  const params = {
    TableName: CONFIG_USERS_TABLE,
    FilterExpression: 'contains(fullName, :value) or contains(address, :value) or contains(email, :value)',
    Limit,
    ExpressionAttributeValues: {
      ':value': query
    },
    Select: 'ALL_ATTRIBUTES'
  };
  if (LastEvaluatedKey) {
    params['ExclusiveStartKey'] = {
      id: LastEvaluatedKey
    }
  }
  console.log(params)
  return dynamoDB
    .scan(params)
    .promise()
    .then(res => res)
    .catch(err => err);
}

export const getAllItemsFromTable = async TableName => {
  const Res = await dynamoDB.scan({ TableName }).promise();
  return Res.Items;
};

export const deleteAllItemsFromTable = async (items: { id: string }) => {
  var counter = 0;
  //split items into patches of 25
  // 25 items is max for batchWrite
  asyncForEach(split(items, 25), async (patch, i) => {
    const RequestItems = {
      'db-users': patch.map(item => {
        return {
          DeleteRequest: {
            Key: {
              id: item.id
            }
          }
        };
      })
    };
    await dynamoDB.batchWrite({ RequestItems }).promise();
    counter += patch.length;
  });
};

function split(arr, n) {
  var res = [];
  while (arr.length) {
    res.push(arr.splice(0, n));
  }
  return res;
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
