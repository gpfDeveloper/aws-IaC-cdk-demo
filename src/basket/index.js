import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import ddbClient from './ddbClient';
import ebClient from './ebClient';

exports.handler = async function (event) {
  console.log('request:', event);
  let data;
  try {
    switch (event.httpMethod) {
      case 'GET':
        if (event.pathParameters !== null) {
          data = await getBasket(event.pathParameters.userId);
        } else {
          data = await getAllBaskets();
        }
        break;
      case 'POST':
        if (event.path === '/basket/checkout') {
          data = await checkoutBasket(JSON.parse(event.body));
        } else {
          data = await createBasket(JSON.parse(event.body));
        }
        break;
      case 'DELETE':
        data = await deleteBasket(event.pathParameters.userId);
        break;
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }
    console.log(data);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        data,
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to perform operation.',
        errorMsg: err.message,
        errorStack: err.stack,
      }),
    };
  }
};

const getBasket = async (userId) => {
  console.log('getBasket - userId: ', userId);
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userId }),
    };
    const { Item } = await ddbClient.send(new GetItemCommand(params));
    console.log(Item);
    return Item ? unmarshall(Item) : {};
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const getAllBaskets = async () => {
  console.log('getAllBaskets');
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };
    const { Items } = await ddbClient.send(new ScanCommand(params));
    console.log(Items);
    return Items ? Items.map((item) => unmarshall(item)) : [];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const createBasket = async (payload) => {
  console.log(`createBasket - payload : "${payload}"`);
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(payload || {}),
    };
    const result = await ddbClient.send(new PutItemCommand(params));
    console.log(result);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const deleteBasket = async (userId) => {
  console.log(`deleteBasket function. userId : "${userId}"`);
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userId }),
    };
    const result = await ddbClient.send(new DeleteItemCommand(params));
    console.log(result);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const checkoutBasket = async (payload) => {
  console.log('checkoutBasket: ', payload);
  if (payload === null || payload.userId === null) {
    throw new Error(`userId should exist in checkoutRequest: "${payload}"`);
  }
  // 1- Get existing basket with items
  const basket = await getBasket(payload.userId);
  // 2- create an event json object with basket items,
  // calculate totalprice, prepare order create json data to send ordering ms
  prepareOrderPayload(payload, basket);
  // 3- publish an event to eventbridge - this will subscribe by order microservice and start ordering process.
  await publishCheckoutBasketEvent(payload);
  // 4- remove existing basket
  await deleteBasket(payload.userId);
};

const prepareOrderPayload = (payload, basket) => {
  console.log('prepareOrderPayload');
  // prepare order payload -> calculate totalprice and combine checkoutRequest and basket items
  // aggregate and enrich request and basket data in order to create order payload
  try {
    if (basket == null || basket.items == null) {
      throw new Error(`basket should exist in items: "${basket}"`);
    }
    // calculate totalPrice
    let totalPrice = 0;
    basket.items.forEach(
      (item) => (totalPrice = totalPrice + item.price * item.qty)
    );
    payload.totalPrice = totalPrice;
    // copies all properties from basket into checkoutRequest
    Object.assign(payload, basket);
    console.log('Success prepareOrderPayload, orderPayload: ', payload);
    return payload;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const publishCheckoutBasketEvent = async (checkoutPayload) => {
  console.log('publishCheckoutBasketEvent with payload: ', checkoutPayload);
  try {
    // eventbridge parameters for setting event to target system
    const params = {
      Entries: [
        {
          Source: process.env.EVENT_BUS_SOURCE,
          Detail: JSON.stringify(checkoutPayload),
          DetailType: process.env.EVENT_BUS_DETAIL_TYPE,
          Resources: [],
          EventBusName: process.env.EVENT_BUS_NAME,
        },
      ],
    };
    console.log('put events command params:', params);
    const data = await ebClient.send(new PutEventsCommand(params));
    console.log('Success, event sent; requestID: ', data);
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
