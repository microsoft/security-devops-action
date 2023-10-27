import * as path from 'path';

export const stagingDirectory = path.join(__dirname, '..', 'lib');

export enum TestConstants {
    Error = 'Error',
    Success = 'Success',
    TaskTestTrace = 'TASK_TEST_TRACE',
    MockResponse = 'MOCK_RESPONSE',
    InputPrefix = 'INPUT_'
};