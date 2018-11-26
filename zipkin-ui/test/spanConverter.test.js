const {SPAN_V1} = require('../js/spanConverter');
const should = require('chai').should();

// endpoints from zipkin2.TestObjects
const frontend = {
  serviceName: 'frontend',
  ipv4: '127.0.0.1',
  port: 8080
};

const backend = {
  serviceName: 'backend',
  ipv4: '192.168.99.101',
  port: 9000
};

const cs = {
  isDerived: true,
  timestamp: 50000,
  value: 'Client Start',
  endpoint: '127.0.0.1:8080 (frontend)'
};
const sr = {
  isDerived: true,
  timestamp: 70000,
  value: 'Server Start',
  endpoint: '192.168.99.101:9000 (backend)'
};
const ss = {
  isDerived: true,
  timestamp: 80000,
  value: 'Server Finish',
  endpoint: '192.168.99.101:9000 (backend)'
};
const cr = {
  isDerived: true,
  timestamp: 100000,
  value: 'Client Finish',
  endpoint: '127.0.0.1:8080 (frontend)'
};

describe('SPAN v2 -> v1 Conversion', () => {
  // originally zipkin2.v1.SpanConverterTest.client
  it('converts client span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'CLIENT',
      timestamp: 1472470996199000,
      duration: 207000,
      localEndpoint: frontend,
      remoteEndpoint: backend,
      annotations: [
        {value: 'ws', timestamp: 1472470996238000},
        {value: 'wr', timestamp: 1472470996403000}
      ],
      tags: {
        'http.path': '/api',
        'clnt/finagle.version': '6.45.0',
      }
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [
        {
          isDerived: true,
          value: 'Client Start',
          timestamp: 1472470996199000,
          endpoint: '127.0.0.1:8080 (frontend)'
        },
        {
          isDerived: false,
          value: 'Wire Send',
          timestamp: 1472470996238000,
          endpoint: '127.0.0.1:8080 (frontend)'
        },
        {
          isDerived: false,
          value: 'Wire Receive',
          timestamp: 1472470996403000,
          endpoint: '127.0.0.1:8080 (frontend)'
        },
        {
          isDerived: true,
          value: 'Client Finish',
          timestamp: 1472470996406000,
          endpoint: '127.0.0.1:8080 (frontend)'
        }
      ],
      tags: [
        {
          key: 'http.path',
          value: '/api',
          endpoint: '127.0.0.1:8080 (frontend)'
        },
        {
          key: 'clnt/finagle.version',
          value: '6.45.0',
          endpoint: '127.0.0.1:8080 (frontend)'
        },
        {
          key: 'Server Address',
          value: '192.168.99.101:9000 (backend)'
        }
      ],
      serviceName: 'frontend', // prefer the local address vs remote
      serviceNames: ['frontend', 'backend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });


  it('should delete self-referencing parentId', () => {
    const converted = SPAN_V1.convert({
      traceId: '1',
      parentId: '3', // self-referencing
      id: '3'
    });

    should.equal(converted.parentId, undefined);
  });

  // originally zipkin2.v1.SpanConverterTest.SpanConverterTest.client_unfinished
  it('converts incomplete client span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'CLIENT',
      timestamp: 1472470996199000,
      localEndpoint: frontend,
      annotations: [{value: 'ws', timestamp: 1472470996238000}]
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'get',
      timestamp: 1472470996199000,
      annotations: [
        {
          isDerived: true,
          value: 'Client Start',
          timestamp: 1472470996199000,
          endpoint: '127.0.0.1:8080 (frontend)'
        },
        {
          isDerived: false,
          value: 'Wire Send',
          timestamp: 1472470996238000,
          endpoint: '127.0.0.1:8080 (frontend)'
        }
      ],
      tags: [], // prefers empty array to nil
      serviceName: 'frontend',
      serviceNames: ['frontend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.client_kindInferredFromAnnotation
  it('infers cr annotation', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      localEndpoint: frontend,
      annotations: [{value: 'cs', timestamp: 1472470996199000}]
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [
        {
          isDerived: true,
          value: 'Client Start',
          timestamp: 1472470996199000,
          endpoint: '127.0.0.1:8080 (frontend)'
        },
        {
          isDerived: true,
          value: 'Client Finish',
          timestamp: 1472470996406000,
          endpoint: '127.0.0.1:8080 (frontend)'
        }
      ],
      tags: [],
      serviceName: 'frontend',
      serviceNames: ['frontend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_cr
  it('converts client span reporting remote endpoint with late cr', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'CLIENT',
      localEndpoint: frontend,
      remoteEndpoint: backend,
      annotations: [{value: 'cr', timestamp: 1472470996199000}]
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'get',
      annotations: [
        {
          isDerived: true,
          value: 'Client Finish',
          timestamp: 1472470996199000,
          endpoint: '127.0.0.1:8080 (frontend)'
        }
      ],
      tags: [{key: 'Server Address', value: '192.168.99.101:9000 (backend)'}],
      serviceName: 'frontend',
      serviceNames: ['frontend', 'backend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_sa
  it('converts late remoteEndpoint to sa', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      remoteEndpoint: backend
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: '', // TODO: check if empty name is needed elsewhere in the codebase still
      annotations: [],
      tags: [{key: 'Server Address', value: '192.168.99.101:9000 (backend)'}],
      serviceNames: ['backend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.noAnnotationsExceptAddresses
  it('converts when remoteEndpoint exist without kind', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      localEndpoint: frontend,
      remoteEndpoint: backend
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [],
      tags: [
        {key: 'Local Address', value: '127.0.0.1:8080 (frontend)'},
        {key: 'Server Address', value: '192.168.99.101:9000 (backend)'}
      ],
      serviceName: 'frontend',
      serviceNames: ['frontend', 'backend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.server
  it('converts root server span', () => {
    // let's pretend there was no caller, so we don't set shared flag
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'get',
      kind: 'SERVER',
      localEndpoint: backend,
      remoteEndpoint: frontend,
      timestamp: 1472470996199000,
      duration: 207000,
      tags: {
        'http.path': '/api',
        'finagle.version': '6.45.0'
      }
    };

    const v1 = {
      traceId: '0000000000000001',
      id: '0000000000000002',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [
        {
          isDerived: true,
          value: 'Server Start',
          timestamp: 1472470996199000,
          endpoint: '192.168.99.101:9000 (backend)'
        },
        {
          isDerived: true,
          value: 'Server Finish',
          timestamp: 1472470996406000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [
        {key: 'http.path', value: '/api', endpoint: '192.168.99.101:9000 (backend)'},
        {key: 'finagle.version', value: '6.45.0', endpoint: '192.168.99.101:9000 (backend)'},
        {key: 'Client Address', value: '127.0.0.1:8080 (frontend)'}
      ],
      serviceName: 'backend',
      serviceNames: ['backend', 'frontend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.missingEndpoints
  it('converts span with no endpoints', () => {
    const v2 = {
      traceId: '1',
      parentId: '1',
      id: '2',
      name: 'foo',
      timestamp: 1472470996199000,
      duration: 207000
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000001',
      id: '0000000000000002',
      name: 'foo',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [],
      tags: [],
      serviceNames: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.coreAnnotation
  it('converts v2 span retaining a cs annotation', () => {
    const v2 = {
      traceId: '1',
      parentId: '1',
      id: '2',
      name: 'foo',
      timestamp: 1472470996199000,
      annotations: [{value: 'cs', timestamp: 1472470996199000}]
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000001',
      id: '0000000000000002',
      name: 'foo',
      timestamp: 1472470996199000,
      annotations: [
        {
          isDerived: true,
          value: 'Client Start',
          timestamp: 1472470996199000
        }
      ],
      tags: [],
      serviceNames: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.server_shared_v1_no_timestamp_duration
  it('converts shared server span without writing timestamp and duration', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'SERVER',
      shared: true,
      localEndpoint: backend,
      timestamp: 1472470996199000,
      duration: 207000
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'get',
      annotations: [
        {
          isDerived: true,
          value: 'Server Start',
          timestamp: 1472470996199000,
          endpoint: '192.168.99.101:9000 (backend)'
        },
        {
          isDerived: true,
          value: 'Server Finish',
          timestamp: 1472470996406000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [],
      serviceName: 'backend',
      serviceNames: ['backend']
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.server_incomplete_shared
  it('converts incomplete shared server span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'SERVER',
      shared: true,
      localEndpoint: backend,
      timestamp: 1472470996199000
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'get',
      annotations: [
        {
          isDerived: true,
          value: 'Server Start',
          timestamp: 1472470996199000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [],
      serviceName: 'backend',
      serviceNames: ['backend']
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_ss
  it('converts late incomplete server span with remote endpoint', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'get',
      kind: 'SERVER',
      localEndpoint: backend,
      remoteEndpoint: frontend,
      annotations: [{value: 'ss', timestamp: 1472470996199000}]
    };

    const v1 = {
      traceId: '0000000000000001',
      id: '0000000000000002',
      name: 'get',
      annotations: [
        {
          isDerived: true,
          value: 'Server Finish',
          timestamp: 1472470996199000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [{key: 'Client Address', value: '127.0.0.1:8080 (frontend)'}],
      serviceName: 'backend',
      serviceNames: ['backend', 'frontend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_ca
  it('converts late remote endpoint server span', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      kind: 'SERVER',
      remoteEndpoint: frontend
    };

    const v1 = {
      traceId: '0000000000000001',
      id: '0000000000000002',
      name: '', // TODO: check if empty name is needed elsewhere in the codebase still
      annotations: [],
      tags: [{key: 'Client Address', value: '127.0.0.1:8080 (frontend)'}],
      serviceNames: ['frontend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.localSpan_emptyComponent
  it('converts local span', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'local',
      localEndpoint: {serviceName: 'frontend'},
      timestamp: 1472470996199000,
      duration: 207000,
    };

    const v1 = {
      traceId: '0000000000000001',
      id: '0000000000000002',
      name: 'local',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [],
      tags: [{key: 'Local Address', value: 'frontend'}],
      serviceName: 'frontend',
      serviceNames: ['frontend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.producer_remote
  it('converts incomplete producer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      kind: 'PRODUCER',
      timestamp: 1472470996199000,
      localEndpoint: frontend
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'send',
      timestamp: 1472470996199000,
      annotations: [
        {
          isDerived: true,
          value: 'Producer Start',
          timestamp: 1472470996199000,
          endpoint: '127.0.0.1:8080 (frontend)'
        }
      ],
      tags: [],
      serviceName: 'frontend',
      serviceNames: ['frontend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.producer_duration
  it('converts producer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      kind: 'PRODUCER',
      localEndpoint: frontend,
      timestamp: 1472470996199000,
      duration: 51000
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'send',
      timestamp: 1472470996199000,
      duration: 51000,
      annotations: [
        {
          isDerived: true,
          value: 'Producer Start',
          timestamp: 1472470996199000,
          endpoint: '127.0.0.1:8080 (frontend)'
        },
        {
          isDerived: true,
          value: 'Producer Finish',
          timestamp: 1472470996250000,
          endpoint: '127.0.0.1:8080 (frontend)'
        }
      ],
      tags: [],
      serviceName: 'frontend',
      serviceNames: ['frontend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.consumer
  it('converts incomplete consumer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'next-message',
      kind: 'CONSUMER',
      timestamp: 1472470996199000,
      localEndpoint: backend
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'next-message',
      timestamp: 1472470996199000,
      annotations: [
        {
          isDerived: true,
          value: 'Consumer Start',
          timestamp: 1472470996199000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [],
      serviceName: 'backend',
      serviceNames: ['backend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.consumer_remote
  it('converts incomplete consumer span with remote endpoint', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'next-message',
      kind: 'CONSUMER',
      timestamp: 1472470996199000,
      localEndpoint: backend,
      remoteEndpoint: {serviceName: 'kafka'}
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'next-message',
      timestamp: 1472470996199000,
      annotations: [
        {
          isDerived: true,
          value: 'Consumer Start',
          timestamp: 1472470996199000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [{key: 'Broker Address', value: 'kafka'}],
      serviceName: 'backend',
      serviceNames: ['backend', 'kafka']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  // originally zipkin2.v1.SpanConverterTest.consumer_duration
  it('converts consumer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      kind: 'CONSUMER',
      localEndpoint: backend,
      timestamp: 1472470996199000,
      duration: 51000
    };

    const v1 = {
      traceId: '0000000000000001',
      parentId: '0000000000000002',
      id: '0000000000000003',
      name: 'send',
      timestamp: 1472470996199000,
      duration: 51000,
      annotations: [
        {
          isDerived: true,
          value: 'Consumer Start',
          timestamp: 1472470996199000,
          endpoint: '192.168.99.101:9000 (backend)'
        },
        {
          isDerived: true,
          value: 'Consumer Finish',
          timestamp: 1472470996250000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [],
      serviceName: 'backend',
      serviceNames: ['backend']
    };

    expect(SPAN_V1.convert(v2)).to.deep.equal(v1);
  });

  it('should prefer ipv6', () => {
    const localEndpoint = {
      serviceName: 'there',
      ipv4: '10.57.50.84',
      ipv6: '2001:db8::c001',
      port: 80
    };

    const v2 = {
      traceId: '1',
      id: '2',
      localEndpoint
    };

    const v1 = SPAN_V1.convert(v2);
    expect(v1.tags.map(s => s.value)).to.deep.equal(['[2001:db8::c001]:80 (there)']);
  });

  it('should not require endpoint serviceName', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      kind: 'CLIENT',
      timestamp: 1,
      localEndpoint: {
        ipv6: '2001:db8::c001'
      }
    };

    const v1 = SPAN_V1.convert(v2);
    expect(v1.annotations.map(s => s.endpoint)).to.deep.equal(['[2001:db8::c001]']);
  });
});

describe('SPAN v1 Merge', () => {
  const clientSpan = {
    traceId: '1',
    parentId: '2',
    id: '3',
    name: 'get',
    timestamp: 1472470996199000,
    duration: 207000,
    annotations: [
      {
        isDerived: true,
        value: 'Client Start',
        timestamp: 1472470996199000,
        endpoint: '127.0.0.1:8080 (frontend)'
      },
      {
        isDerived: true,
        value: 'Client Finish',
        timestamp: 1472470996406000,
        endpoint: '127.0.0.1:8080 (frontend)'
      }
    ],
    tags: [],
    serviceName: 'frontend',
    serviceNames: ['frontend']
  };
  const serverSpan = {
    traceId: '1',
    parentId: '2',
    id: '3',
    name: 'get',
    annotations: [
      {
        isDerived: true,
        value: 'Server Start',
        timestamp: 1472470996238000,
        endpoint: '192.168.99.101:9000 (backend)'
      },
      {
        isDerived: true,
        value: 'Server Finish',
        timestamp: 1472470996403000,
        endpoint: '192.168.99.101:9000 (backend)'
      }
    ],
    tags: [],
    serviceName: 'backend',
    serviceNames: ['backend']
  };
  const mergedSpan = {
    traceId: '0000000000000001',
    parentId: '0000000000000002',
    id: '0000000000000003',
    name: 'get',
    timestamp: 1472470996199000,
    duration: 207000,
    annotations: [
      {
        isDerived: true,
        value: 'Client Start',
        timestamp: 1472470996199000,
        endpoint: '127.0.0.1:8080 (frontend)'
      },
      {
        isDerived: true,
        value: 'Server Start',
        timestamp: 1472470996238000,
        endpoint: '192.168.99.101:9000 (backend)'
      },
      {
        isDerived: true,
        value: 'Server Finish',
        timestamp: 1472470996403000,
        endpoint: '192.168.99.101:9000 (backend)'
      },
      {
        isDerived: true,
        value: 'Client Finish',
        timestamp: 1472470996406000,
        endpoint: '127.0.0.1:8080 (frontend)'
      }
    ],
    tags: [],
    serviceName: 'backend', // prefer server in shared span
    serviceNames: ['frontend', 'backend']
  };

  it('should merge server and client span', () => {
    const merged = SPAN_V1.merge(serverSpan, clientSpan);

    expect(merged).to.deep.equal(mergedSpan);
  });

  it('should delete self-referencing parentId', () => {
    const merged = SPAN_V1.merge({
      traceId: '1',
      parentId: '3', // self-referencing
      id: '3'
    }, clientSpan);

    expect(merged.parentId).to.equal(clientSpan.parentId.padStart(16, '0'));
  });

  it('should merge client and server span', () => {
    const merged = SPAN_V1.merge(clientSpan, serverSpan);

    expect(merged).to.deep.equal(mergedSpan);
  });

  // originally zipkin2.v1.SpanConverterTest.mergeWhenTagsSentSeparately
  it('should add late server addr', () => {
    const merged = SPAN_V1.merge(clientSpan, {
      traceId: '1',
      id: '3',
      tags: [{key: 'Server Address', value: '192.168.99.101:9000 (backend)'}]
    });

    expect(merged.tags).to.deep.equal(
      [{key: 'Server Address', value: '192.168.99.101:9000 (backend)'}]);
  });

  // originally zipkin2.v1.SpanConverterTest.mergePrefersServerSpanName
  it('should overwrite client name with server name', () => {
    const merged = SPAN_V1.merge(clientSpan, {
      traceId: '1',
      id: '3',
      name: 'get /users/:userId',
      annotations: [
        {
          isDerived: true,
          value: 'Server Start',
          timestamp: 1472470996238000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: []
    });

    expect(merged.name).to.equal('get /users/:userId');
  });

  // originally zipkin2.v1.SpanConverterTest.timestampAndDurationMergeWithClockSkew
  it('should merge timestamp and duration even with skew', () => {
    const leftTimestamp = 100 * 1000;
    const leftDuration = 35 * 1000;

    const rightTimestamp = 200 * 1000;
    const rightDuration = 30 * 1000;

    const leftSpan = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: leftTimestamp,
      duration: leftDuration,
      annotations: [
        {
          isDerived: true,
          value: 'Client Start',
          timestamp: leftTimestamp,
          endpoint: '127.0.0.1:8080 (frontend)'
        },
        {
          isDerived: true,
          value: 'Client Finish',
          timestamp: leftTimestamp + leftDuration,
          endpoint: '127.0.0.1:8080 (frontend)'
        }
      ],
      tags: [],
      serviceName: 'frontend',
      serviceNames: ['frontend']
    };

    const rightSpan = {
      traceId: '1',
      id: '3',
      name: 'get',
      timestamp: rightTimestamp,
      duration: rightDuration,
      annotations: [
        {
          isDerived: true,
          value: 'Server Start',
          timestamp: rightTimestamp,
          endpoint: '192.168.99.101:9000 (backend)'
        },
        {
          isDerived: true,
          value: 'Server Finish',
          timestamp: rightTimestamp + rightDuration,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [],
      serviceName: 'backend',
      serviceNames: ['backend']
    };

    const leftFirst = SPAN_V1.merge(leftSpan, rightSpan);
    const rightFirst = SPAN_V1.merge(rightSpan, leftSpan);

    [leftFirst, rightFirst].forEach((completeSpan) => {
      expect(completeSpan.timestamp).to.equal(leftTimestamp);
      expect(completeSpan.duration).to.equal(leftDuration);

      // ensure if server isn't propagated the parent ID, it is still ok.
      expect(completeSpan.parentId).to.equal('0000000000000002');
    });
  });

  // originally zipkin2.v1.SpanConverterTest.mergeTraceIdHigh
  it('should prefer 128bit trace ID', () => {
    const left = {
      traceId: '463ac35c9f6413ad48485a3953bb6124',
      id: '3'
    };

    const right = {
      traceId: '48485a3953bb6124',
      id: '3'
    };

    const leftFirst = SPAN_V1.merge(left, right);
    const rightFirst = SPAN_V1.merge(right, left);

    [leftFirst, rightFirst].forEach((completeSpan) => {
      expect(completeSpan.traceId).to.equal(left.traceId);
    });
  });

  it('should not overwrite client name with empty', () => {
    const merged = SPAN_V1.merge(clientSpan, {
      traceId: '1',
      id: '3',
      name: '',
      annotations: [
        {
          isDerived: true,
          value: 'Server Start',
          timestamp: 1472470996238000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [],
      serviceName: 'backend',
      serviceNames: ['backend']
    });

    expect(merged.name).to.equal(clientSpan.name);
  });

  it('should not overwrite client name with unknown', () => {
    const merged = SPAN_V1.merge(clientSpan, {
      traceId: '1',
      id: '3',
      name: 'unknown',
      annotations: [
        {
          isDerived: true,
          value: 'Server Start',
          timestamp: 1472470996238000,
          endpoint: '192.168.99.101:9000 (backend)'
        }
      ],
      tags: [],
      serviceName: 'backend',
      serviceNames: ['backend']
    });

    expect(merged.name).to.equal(clientSpan.name);
  });
});

describe('SPAN v1 apply timestamp and duration', () => {
  // originally zipkin2.v1.SpanConverterTest.apply_onlyCs
  it('should choose cs timestamp', () => {
    const span = SPAN_V1.applyTimestampAndDuration({
      traceId: '1',
      id: '3',
      name: '',
      annotations: [cs]
    });

    expect(span.timestamp).to.equal(cs.timestamp);
    should.equal(span.duration, undefined);
  });

  // originally zipkin2.v1.SpanConverterTest.apply_rpcSpan
  it('should choose client duration in merged span', () => {
    const span = SPAN_V1.applyTimestampAndDuration({
      traceId: '1',
      id: '3',
      name: '',
      annotations: [cs, sr, ss, cr]
    });

    expect(span.timestamp).to.equal(cs.timestamp);
    expect(span.duration).to.equal(cr.timestamp - cs.timestamp);
  });

  // originally zipkin2.v1.SpanConverterTest.apply_serverOnly
  it('should choose compute duration from server annotations', () => {
    const span = SPAN_V1.applyTimestampAndDuration({
      traceId: '1',
      id: '3',
      name: '',
      annotations: [sr, ss]
    });

    expect(span.timestamp).to.equal(sr.timestamp);
    expect(span.duration).to.equal(ss.timestamp - sr.timestamp);
  });

  // originally zipkin2.v1.SpanConverterTest.apply_oneWay
  it('should choose compute duration for a one-way span', () => {
    const span = SPAN_V1.applyTimestampAndDuration({
      traceId: '1',
      id: '3',
      name: '',
      annotations: [cs, sr]
    });

    expect(span.timestamp).to.equal(cs.timestamp);
    expect(span.duration).to.equal(sr.timestamp - cs.timestamp);
  });

  // originally zipkin2.v1.SpanConverterTest.bestTimestamp_isSpanTimestamp
  it('should choose prefer span timestamp to cs annotation', () => {
    const span = SPAN_V1.applyTimestampAndDuration({
      traceId: '1',
      id: '3',
      name: '',
      timestamp: cs.timestamp - 1,
      annotations: [cs]
    });

    expect(span.timestamp).to.equal(cs.timestamp - 1);
    should.equal(span.duration, undefined);
  });

  // originally zipkin2.v1.SpanConverterTest.bestTimestamp_isNotARandomAnnotation
  it('should not choose a random annotation for the timestamp', () => {
    const span = SPAN_V1.applyTimestampAndDuration({
      traceId: '1',
      id: '3',
      name: '',
      annotations: [
        {
          isDerived: false,
          timestamp: 50000,
          value: 'foo',
          endpoint: '127.0.0.1:8080 (frontend)'
        }
      ]
    });

    should.equal(span.timestamp, undefined);
    should.equal(span.duration, undefined);
  });

  // originally zipkin2.v1.SpanConverterTest.bestTimestamp_isARootServerSpan
  it('should choose cs timestamp', () => {
    const span = SPAN_V1.applyTimestampAndDuration({
      traceId: '1',
      id: '3',
      name: '',
      annotations: [sr]
    });

    expect(span.timestamp).to.equal(sr.timestamp);
    should.equal(span.duration, undefined);
  });
});

describe('SPAN v1 merge by ID', () => {
  it('should merge client and server span', () => {
    const spans = SPAN_V1.mergeById([
      {
        traceId: '1',
        id: '3',
        name: '',
        annotations: [sr, ss]
      },
      {
        traceId: '1',
        id: '3',
        name: '',
        annotations: [cs, cr]
      }
    ]);

    expect(spans).to.deep.equal([
      {
        traceId: '0000000000000001',
        id: '0000000000000003',
        name: '',
        timestamp: cs.timestamp,
        duration: cr.timestamp - cs.timestamp,
        annotations: [cs, sr, ss, cr],
        tags: [],
        serviceNames: []
      }
    ]);
  });

  it('should merge mixed length ID', () => {
    const spans = SPAN_V1.mergeById([
      {
        traceId: '1111111111111111',
        id: '3',
        name: '',
        annotations: [sr, ss]
      },
      {
        traceId: '21111111111111111',
        id: '3',
        name: '',
        annotations: [cs, cr]
      }
    ]);

    expect(spans).to.deep.equal([
      {
        traceId: '00000000000000021111111111111111',
        id: '0000000000000003',
        name: '',
        timestamp: cs.timestamp,
        duration: cr.timestamp - cs.timestamp,
        annotations: [cs, sr, ss, cr],
        tags: [],
        serviceNames: []
      }
    ]);
  });

  it('should order results by timestamp then name', () => {
    const spans = SPAN_V1.mergeById([
      {
        traceId: '0000000000000001',
        parentId: '0000000000000001',
        id: '0000000000000002',
        name: 'c',
        timestamp: 3
      },
      {
        traceId: '0000000000000001',
        parentId: '0000000000000001',
        id: '0000000000000003',
        name: 'b',
        timestamp: 2
      },
      {
        traceId: '0000000000000001',
        parentId: '0000000000000001',
        id: '0000000000000004',
        name: 'a',
        timestamp: 2
      }
    ]);

    expect(spans.map(s => s.id)).to.deep.equal([
      '0000000000000004',
      '0000000000000003',
      '0000000000000002',
    ]);
  });

  it('should order root first even if skewed timestamp', () => {
    const spans = SPAN_V1.mergeById([
      {
        traceId: '0000000000000001',
        id: '0000000000000001',
        name: 'c',
        timestamp: 3
      },
      {
        traceId: '0000000000000001',
        id: '0000000000000002',
        parentId: '0000000000000001',
        name: 'b',
        timestamp: 2 // happens before its parent
      },
      {
        traceId: '0000000000000001',
        id: '0000000000000003',
        parentId: '0000000000000001',
        name: 'b',
        timestamp: 3
      }
    ]);

    expect(spans.map(s => s.id)).to.deep.equal([
      '0000000000000001',
      '0000000000000002',
      '0000000000000003'
    ]);
  });
});
