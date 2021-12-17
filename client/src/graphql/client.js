import {
  ApolloClient, ApolloLink, HttpLink, InMemoryCache, split
} from 'apollo-boost';
import { WebSocketLink } from 'apollo-link-ws'
import { getAccessToken } from '../auth';
import { getMainDefinition } from "apollo-utilities"
const httpUrl = 'http://localhost:9000/graphql';
const wsUrl = 'ws://localhost:9000/graphql';

const wsLink = new WebSocketLink({
  uri: wsUrl,
  options: {
    connectionParams: () => ({ //Force function call every time a connection is created
      accessToken: getAccessToken()
    }),
    lazy: true,
    reconnect: true
  }
  
})

function isSubscription(operation){
  const definition = getMainDefinition(operation.query);
  return definition.kind === 'OperationDefinition' 
  && definition.operation === 'subscription'
}

const httpLink = ApolloLink.from([
  new ApolloLink((operation, forward) => {
    const token = getAccessToken();
    if (token) {
      operation.setContext({headers: {'authorization': `Bearer ${token}`}});
    }
    return forward(operation);
  }),
  new HttpLink({uri: httpUrl})
]);

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: split(isSubscription, wsLink, httpLink) ,
  defaultOptions: {query: {fetchPolicy: 'no-cache'}}
});

export default client;
