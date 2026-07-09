declare type IScopeValue = 0 | 1 | 2;
declare type IScopeKey = 'SINGLETON' | 'TRANSIENT' | 'SCOPED';

declare type IScalarValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;
declare type IScalarKey = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'INT' | 'DATE' | 'UUID' | 'TEXT';

declare type ILogerLevelValue = 0 | 1 | 2 | 3 | 4;
declare type ILogerLevelKey = 'DEBUG' | 'LOG' | 'INFO' | 'WARN' | 'ERROR';

declare type IPackageGroupsValue = 0 | 1 | 2;
declare type IPackageGroupsKey = 'NODE' | 'NPM' | 'LIB';

declare type IConfigEnvironmentValue = 'dev' | 'app' | 'test' | 'stag';
declare type IConfigEnvironmentKey = 'DEVELOPMENT' | 'PRODUCTION' | 'TESTING' | 'STAGING';

declare type IApplicationEventValue = '0' | '1' | '2' | '3' | '4' | '5';
declare type IApplicationEventKey = 'PREPARE' | 'RUN' | 'STOP' | 'ERROR' | 'MESSAGE' | 'BUILD';
