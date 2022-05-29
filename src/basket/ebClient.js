import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
// Create an Amazon EventBridge service client object.
const ebClient = new EventBridgeClient();
export default ebClient;
