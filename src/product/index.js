import {
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuid } from 'uuid';
import ddbClient from './ddbClient';

exports.handler = async (event) => {
  console.log('request event: ', event);
  let data;
  try {
    switch (event.httpMethod) {
      case 'GET':
        if (event.queryStringParameters !== null) {
          data = await getProductsByCategory(
            event.queryStringParameters.category
          );
        } else if (event.pathParameters !== null) {
          data = await getProduct(event.pathParameters.id);
        } else {
          data = await getAllProducts();
        }
        break;
      case 'POST':
        data = await createProduct(JSON.parse(event.body));
        break;
      case 'PUT':
        data = await updateProduct(
          event.pathParameters.id,
          JSON.parse(event.body)
        );
        break;
      case 'DELETE':
        data = await deleteProduct(event.pathParameters.id);
        break;
      default:
        throw Error(`Unsupported routes: ${event.httpMethod}`);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: ${event.httpMethod}`,
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

const getAllProducts = async () => {
  console.log('getAllProducts');
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };
    const { Items } = await ddbClient.send(new ScanCommand(params));
    console.log(Items);
    return Items ? Items.map((item) => unmarshall(item)) : [];
  } catch (err) {
    console.error(e);
    throw err;
  }
};

// /product?category=phone
const getProductsByCategory = async (category) => {
  console.log('getProductsByCategory: ', category);
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      FilterExpression: 'category = :category',
      ExpressionAttributeValues: { ':category': { S: category } },
    };
    console.log('params: ', params);
    const { Items } = await ddbClient.send(new ScanCommand(params));
    console.log(Items);
    return Items ? Items.map((item) => unmarshall(item)) : [];
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const getProduct = async (id) => {
  console.log('getProduct: ', id);
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id }),
    };
    const { Item } = await ddbClient.send(new GetItemCommand(params));
    console.log(Item);
    return Item ? unmarshall(Item) : {};
  } catch (err) {
    console.error(e);
    throw err;
  }
};

const createProduct = async (payload) => {
  const product = { ...payload, id: uuid() };
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(product),
    };
    const result = await ddbClient.send(new PutItemCommand(params));
    console.log('create result: ', result);
  } catch (err) {
    console.error(e);
    throw err;
  }
};

const updateProduct = async (id, payload) => {
  console.log('updateProduct: ', id, payload);
  const objKeys = Object.keys(payload);
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id }),
      UpdateExpression: `SET ${objKeys
        .map((_, index) => `#key${index} = :value${index}`)
        .join(', ')}`,
      ExpressionAttributeNames: objKeys.reduce(
        (acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
        }),
        {}
      ),
      ExpressionAttributeValues: marshall(
        objKeys.reduce(
          (acc, key, index) => ({
            ...acc,
            [`:value${index}`]: payload[key],
          }),
          {}
        )
      ),
    };
    const result = await ddbClient.send(new UpdateItemCommand(params));
    console.log('update result: ', result);
    return result;
  } catch (err) {
    console.error(e);
    throw err;
  }
};

const deleteProduct = async (id) => {
  console.log('deleteProduct: ', id);
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id }),
    };
    const result = await ddbClient.send(new DeleteItemCommand(params));
    console.log('delete result: ', result);
    return result;
  } catch (err) {
    console.error(e);
    throw err;
  }
};
