/*
 * Copyright 2015-2019 The OpenZipkin Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';

import * as actions from './trace-action';
import * as types from '../constants/action-types';
import * as api from '../constants/api';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('trace async actions', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('create FETCH_TRACE_SUCCESS when fetching a trace has been done', () => {
    fetchMock.getOnce(`${api.TRACE}/d050e0d52326cf81`, {
      body: [
        {
          traceId: 'd050e0d52326cf81',
          parentId: 'd050e0d52326cf81',
          id: 'd1ccbada31490783',
          kind: 'CLIENT',
          name: 'getInfoByAccessToken',
          timestamp: 1542337504412859,
          duration: 8667,
          localEndpoint: {
            serviceName: 'serviceA',
            ipv4: '127.0.0.1',
          },
          remoteEndpoint: {
            serviceName: 'serviceB',
            ipv4: '127.0.0.2',
            port: 8080,
          },
        },
      ],
      headers: {
        'content-type': 'application/json',
      },
    });

    const expectedActions = [
      { type: types.FETCH_TRACE_REQUEST },
      {
        type: types.FETCH_TRACE_SUCCESS,
        trace: [
          {
            traceId: 'd050e0d52326cf81',
            parentId: 'd050e0d52326cf81',
            id: 'd1ccbada31490783',
            kind: 'CLIENT',
            name: 'getInfoByAccessToken',
            timestamp: 1542337504412859,
            duration: 8667,
            localEndpoint: {
              serviceName: 'serviceA',
              ipv4: '127.0.0.1',
            },
            remoteEndpoint: {
              serviceName: 'serviceB',
              ipv4: '127.0.0.2',
              port: 8080,
            },
          },
        ],
      },
    ];
    const store = mockStore({});

    return store.dispatch(actions.fetchTrace('d050e0d52326cf81')).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
