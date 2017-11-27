module.exports = {
  entry: ['./index'],
  components: [
    'pundle-reporter-console',
    'pundle-resolver-node',
    [
      'pundle-loader-js',
      {
        replaceVariables: {
          'process.env.NODE_ENV': JSON.stringify('development'),
        },
        extensions: ['.js', '.ts'],
      },
    ],
    [
      'pundle-generator-browser',
      {
        publicDirectory: '/',
      },
    ],
    [
      'pundle-loader-url',
      {
        maxSize: 10 * 1024,
        publicDirectory: '/',
        extensions: ['.png'],
      },
    ],
    [
      'pundle-loader-css',
      {
        scoped: false,
      },
    ],
    'pundle-transformer-babel',
    'pundle-transformer-typescript',
    'pundle-loader-json',
    'pundle-job-transformer-commons',
    'pundle-file-generator-html',
    'pundle-resolver-dedupe',
    [
      'pundle-job-transformer-static-injector',
      {
        files: ['static/index.html'],
      },
    ],
    // 'pundle-post-generator-uglify',
  ],
  output: {
    name: '',
    directory: 'public',
  },
}
