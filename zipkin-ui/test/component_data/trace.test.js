import {convertSuccessResponse, toContextualLogsUrl} from '../../js/component_data/trace';
import {errorTrace, httpTrace, skewedTrace} from '../component_ui/traceTestHelpers';

describe('convertSuccessResponse', () => {
  it('should convert an http trace', () => {
    const spans = [
      {
        spanId: 'bb1f0e21882325b8',
        parentId: null,
        spanName: 'get /',
        serviceNames: 'frontend',
        serviceName: 'frontend',
        duration: 168731,
        durationStr: '168.731ms',
        left: 0,
        width: 100,
        depth: 10,
        depthClass: 0,
        children: 'c8c50ebd2abc179e',
        annotations: [
          {
            isDerived: true,
            left: 0,
            endpoint: '172.17.0.13 (frontend)',
            value: 'Server Start',
            timestamp: 1541138169255688,
            relativeTime: '',
            width: 8
          },
          {
            isDerived: true,
            left: 100,
            endpoint: '172.17.0.13 (frontend)',
            value: 'Server Finish',
            timestamp: 1541138169424419,
            relativeTime: '168.731ms',
            width: 8
          }
        ],
        tags: [
          {
            key: 'http.method',
            value: 'GET',
            endpoint: '172.17.0.13 (frontend)'
          },
          {
            key: 'http.path',
            value: '/',
            endpoint: '172.17.0.13 (frontend)'
          },
          {
            key: 'mvc.controller.class',
            value: 'Frontend',
            endpoint: '172.17.0.13 (frontend)'
          },
          {
            key: 'mvc.controller.method',
            value: 'callBackend',
            endpoint: '172.17.0.13 (frontend)'
          },
          {
            key: 'Client Address',
            value: '110.170.201.178:63678'
          }
        ],
        errorType: 'none'
      },
      {
        spanId: 'c8c50ebd2abc179e',
        parentId: 'bb1f0e21882325b8',
        spanName: 'get /api',
        serviceNames: 'frontend,backend',
        serviceName: 'backend',
        duration: 111121,
        durationStr: '111.121ms',
        left: 24.82294302765941,
        width: 65.8568964801963,
        depth: 15,
        depthClass: 1,
        children: '',
        annotations: [
          {
            isDerived: true,
            left: 0,
            endpoint: '172.17.0.13 (frontend)',
            value: 'Client Start',
            timestamp: 1541138169297572,
            relativeTime: '41.884ms',
            width: 8
          },
          {
            isDerived: false,
            left: 36.1074864337074,
            endpoint: '172.17.0.13 (frontend)',
            value: 'Wire Send',
            timestamp: 1541138169337695,
            relativeTime: '82.007ms',
            width: 8
          },
          {
            isDerived: true,
            left: 38.15435426247064,
            endpoint: '172.17.0.9 (backend)',
            value: 'Server Start',
            timestamp: 1541138169339969.5,
            relativeTime: '84.281ms',
            width: 8
          },
          {
            isDerived: true,
            left: 61.84564573752937,
            endpoint: '172.17.0.9 (backend)',
            value: 'Server Finish',
            timestamp: 1541138169366295.5,
            relativeTime: '110.608ms',
            width: 8
          },
          {
            isDerived: false,
            left: 63.8925135662926,
            endpoint: '172.17.0.13 (frontend)',
            value: 'Wire Receive',
            timestamp: 1541138169368570,
            relativeTime: '112.882ms',
            width: 8
          },
          {
            isDerived: true,
            left: 100,
            endpoint: '172.17.0.13 (frontend)',
            value: 'Client Finish',
            timestamp: 1541138169408693,
            relativeTime: '153.005ms',
            width: 8
          }
        ],
        tags: [
          {
            key: 'http.method',
            value: 'GET',
            endpoint: '172.17.0.13 (frontend)'
          },
          {
            key: 'http.path',
            value: '/api',
            endpoint: '172.17.0.13 (frontend)'
          },
          {
            key: 'mvc.controller.class',
            value: 'Backend',
            endpoint: '172.17.0.9 (backend)'
          },
          {
            key: 'mvc.controller.method',
            value: 'printDate',
            endpoint: '172.17.0.9 (backend)'
          },
          {
            key: 'Client Address',
            value: '172.17.0.13:63679'
          }
        ],
        errorType: 'none'
      }
    ];

    const timeMarkers = [
      {index: 0, time: ''},
      {index: 1, time: '33.746ms'},
      {index: 2, time: '67.492ms'},
      {index: 3, time: '101.239ms'},
      {index: 4, time: '134.985ms'},
      {index: 5, time: '168.731ms'}
    ];

    const expectedTemplate = {
      traceId: 'bb1f0e21882325b8',
      duration: '168.731ms',
      services: 2,
      depth: 3,
      spanCount: 3,
      serviceNameAndSpanCounts: [
        {serviceName: 'backend', spanCount: 1},
        {serviceName: 'frontend', spanCount: 2}
      ],
      timeMarkers,
      timeMarkersBackup: timeMarkers, // TODO: what is backup and why??
      spans,
      spansBackup: spans, // TODO: what is backup and why??
      logsUrl: undefined
    };

    const rawResponse = httpTrace;
    convertSuccessResponse(rawResponse).should.deep.equal(
      {modelview: expectedTemplate, trace: rawResponse}
    );
  });

  it('should convert an error trace', () => {
    const spans = [
      {
        spanId: '1e223ff1f80f1c69',
        parentId: null,
        spanName: '',
        serviceNames: 'backend',
        serviceName: 'backend',
        duration: 17,
        durationStr: '17μ',
        left: 0,
        width: 100,
        depth: 10,
        depthClass: 0,
        children: '',
        annotations: [],
        tags: [
          {
            key: 'error',
            value: 'request failed',
            endpoint: '172.17.0.9 (backend)'
          }
        ],
        errorType: 'critical'
      }
    ];

    const timeMarkers = [
      {index: 0, time: ''},
      {index: 1, time: '3μ'},
      {index: 2, time: '7μ'},
      {index: 3, time: '10μ'},
      {index: 4, time: '14μ'},
      {index: 5, time: '17μ'}
    ];

    const expectedTemplate = {
      traceId: '1e223ff1f80f1c69',
      duration: '17μ',
      services: 1,
      depth: 1,
      spanCount: 1,
      serviceNameAndSpanCounts: [
        {serviceName: 'backend', spanCount: 1}
      ],
      timeMarkers,
      timeMarkersBackup: timeMarkers, // TODO: what is backup and why??
      spans,
      spansBackup: spans, // TODO: what is backup and why??
      logsUrl: undefined
    };

    const rawResponse = errorTrace;
    convertSuccessResponse(rawResponse).should.deep.equal(
      {modelview: expectedTemplate, trace: rawResponse}
    );
  });

  it('should throw error on empty trace', () => {
    let error;
    try {
      convertSuccessResponse([]);
    } catch (err) {
      error = err;
    }

    expect(error.message).to.eql('Trace was empty');
  });

  it('should throw error on trace missing timestamp', () => {
    const missingTimestamp = {
      traceId: '2',
      id: '2',
      duration: 1,
      localEndpoint: {serviceName: 'B'}
    };

    let error;
    try {
      convertSuccessResponse([missingTimestamp]);
    } catch (err) {
      error = err;
    }

    expect(error.message).to.eql('Trace is missing a timestamp');
  });

  it('should convert a skewed trace', () => {
    const spans = [
      {
        spanId: 'bf396325699c84bf',
        parentId: null,
        spanName: 'get',
        serviceNames: 'servicea',
        serviceName: 'servicea',
        duration: 99411,
        durationStr: '99.411ms',
        left: 0,
        width: 100,
        depth: 10,
        depthClass: 0,
        children: '74280ae0c10d8062',
        annotations: [
          {
            isDerived: true,
            left: 0,
            endpoint: '127.0.0.0 (servicea)',
            value: 'Server Start',
            timestamp: 1470150004071068,
            relativeTime: '',
            width: 8
          },
          {
            isDerived: true,
            left: 100,
            endpoint: '127.0.0.0 (servicea)',
            value: 'Server Finish',
            timestamp: 1470150004170479,
            relativeTime: '99.411ms',
            width: 8
          }
        ],
        tags: [],
        errorType: 'none'
      },
      {
        spanId: '74280ae0c10d8062',
        parentId: 'bf396325699c84bf',
        spanName: 'post',
        serviceName: 'serviceb',
        serviceNames: 'servicea,serviceb',
        duration: 94539,
        durationStr: '94.539ms',
        left: 3.152568629226142,
        width: 95.09913389866313,
        depth: 15,
        depthClass: 1,
        children: '43210ae0c10d1234',
        annotations: [
          {
            isDerived: true,
            left: 0,
            endpoint: '127.0.0.0 (servicea)',
            value: 'Client Start',
            timestamp: 1470150004074202,
            relativeTime: '3.134ms',
            width: 8
          },
          {
            isDerived: true,
            left: 0.5087847343424406,
            endpoint: '192.0.0.0 (serviceb)',
            value: 'Server Start',
            timestamp: 1470150004074683,
            relativeTime: '3.615ms',
            width: 8
          },
          {
            isDerived: true,
            left: 99.49121526565756,
            endpoint: '192.0.0.0 (serviceb)',
            value: 'Server Finish',
            timestamp: 1470150004168260,
            relativeTime: '97.192ms',
            width: 8
          },
          {
            isDerived: true,
            left: 100,
            endpoint: '127.0.0.0 (servicea)',
            value: 'Client Finish',
            timestamp: 1470150004168741,
            relativeTime: '97.673ms',
            width: 8
          }
        ],
        tags: [],
        errorType: 'none'
      },
      {
        spanId: '43210ae0c10d1234',
        parentId: '74280ae0c10d8062',
        spanName: 'async',
        serviceNames: 'serviceb',
        serviceName: 'serviceb',
        duration: 65000,
        durationStr: '65ms',
        left: 3.6374244298920644,
        width: 65.3851183470642,
        depth: 20,
        depthClass: 2,
        children: '',
        annotations: [],
        tags: [
          {
            key: 'Local Address',
            value: '192.0.0.0 (serviceb)'
          }
        ],
        errorType: 'none'
      }
    ];

    const timeMarkers = [
      {index: 0, time: ''},
      {index: 1, time: '19.882ms'},
      {index: 2, time: '39.764ms'},
      {index: 3, time: '59.647ms'},
      {index: 4, time: '79.529ms'},
      {index: 5, time: '99.411ms'}
    ];

    const expectedTemplate = {
      traceId: '1e223ff1f80f1c69',
      duration: '99.411ms',
      services: 2,
      depth: 4,
      spanCount: 4,
      serviceNameAndSpanCounts: [
        {serviceName: 'servicea', spanCount: 2},
        {serviceName: 'serviceb', spanCount: 2}
      ],
      timeMarkers,
      timeMarkersBackup: timeMarkers,
      spans,
      spansBackup: spans,
      logsUrl: undefined
    };

    const rawResponse = skewedTrace;
    convertSuccessResponse(rawResponse).should.deep.equal(
      {modelview: expectedTemplate, trace: rawResponse}
    );
  });
});

describe('toContextualLogsUrl', () => {
  it('replaces token in logsUrl when set', () => {
    const logsUrl = 'http://company.com/kibana/#/discover?_a=(query:(query_string:(query:\'{traceId}\')))';
    const traceId = '86bad84b319c8379';
    toContextualLogsUrl(logsUrl, traceId)
      .should.equal(logsUrl.replace('{traceId}', traceId));
  });

  it('returns logsUrl when not set', () => {
    const logsUrl = undefined;
    const traceId = '86bad84b319c8379';
    (typeof toContextualLogsUrl(logsUrl, traceId)).should.equal('undefined');
  });

  it('returns the same url when token not present', () => {
    const logsUrl = 'http://mylogqueryservice.com/';
    const traceId = '86bad84b319c8379';
    toContextualLogsUrl(logsUrl, traceId).should.equal(logsUrl);
  });
});
