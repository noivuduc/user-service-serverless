import { APIGatewayEvent, Callback, Context, Handler } from "aws-lambda";
import * as uuid from "uuid/v4";

import { massInsert, searchUsers, deleteAllItemsFromTable, getAllItemsFromTable } from "./dynamodb-actions";

export const respond = (fulfillmentText: any, statusCode: number): any => {
  return {
    statusCode,
    body: JSON.stringify(fulfillmentText),
    headers: {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    }
  };
};

export const initData: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {

  // Clear database
  const data = await getAllItemsFromTable('db-users')
  deleteAllItemsFromTable(data)


  const RequestItems = {
    'db-users': []
  }
  const users = require('./resources/users.json')
  const batches = []
  let counter = 0
  // create batch
  // each batch consist of 25 requests
  let batch = []
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    if (counter == 25) {
      batches.push(batch)
      batch = []
      counter = 0
    }
    counter++
    const PutRequest = {
      Item: {
        id: uuid(),
        fullName: user.name,
        address: user.address,
        gender: user.gender,
        email: user.email,
        phone: user.phone

      }
    }
    batch.push({ PutRequest })
  }
  try {
    for (const batch of batches) {
      RequestItems['db-users'] = batch
      await massInsert({ RequestItems })
    }

    return respond({ success: true }, 201);
  } catch (err) {
    return respond(err, 400);
  }
};

export const search: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  const q: string = event.queryStringParameters.q;
  const key: string = event.queryStringParameters.key || null;
  const limit: number = parseInt(event.queryStringParameters.limit) || null;
  try {
    const users = await searchUsers(q, key, limit);

    return respond(users, 200);
  } catch (err) {
    return respond(err, 404);
  }
};
