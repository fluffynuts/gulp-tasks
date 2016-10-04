const
  expect = require('chai').expect,
  fs = require('fs'),
  jsdom = require('jsdom'),
  rimraf = require('rimraf'),
  proxyquire = require('proxyquire'),
  sinon = require('sinon');

describe('nunit-downloader', () => {
  var NUnitDownloader, proxies;
  beforeEach(() => {
    proxies = {
      request: sinon.stub(),
      jsdom: {
        env: sinon.stub()
      }
    }
    NUnitDownloader = proxyquire('../modules/nunit-downloader', proxies);
  });
  it('will export the NUnitDownloader prototype', () => {
    // Arrange
    // Act
    expect(NUnitDownloader).to.exist;
    // Assert
  });
  describe('NUnitDownloader', () => {
    function create(url) {
      return new NUnitDownloader(url);
    }

    it('will have a downloadLatestTo method', () => {
      // Arrange
      const sut = create();
      // Act
      expect(sut.downloadLatestTo).to.be.a('function');
      // Assert
    });

    describe('downloadLatestTo', () => {
      it('will start a request against the default url when no url provided', () => {
        // Arrange
        const sut = create();
        // Act
        sut.downloadLatestTo('some-folder');
        // Assert
        expect(proxies.request).to.have.been.calledOnce;
        expect(proxies.request.firstCall.args[0]).to.equal(NUnitDownloader.DEFAULT_URL);
      });
      it('will start a request against the provided url when provided', () => {
        // Arrange
        const
          url = 'http://some-url/whatever',
          sut = create(url);
        // Act
        sut.downloadLatestTo('some-folder');
        // Assert
        expect(proxies.request).to.have.been.calledOnce;
        expect(proxies.request.firstCall.args[0]).to.equal(url);
      });
      it('will return a promise', () => {
        // Arrange
        const sut = create();
        // Act
        const result = sut.downloadLatestTo('some-folder');
        // Assert
        expect(result).to.be.a('Promise');
      });
      it('will provide a handler function for the request', () => {
        // Arrange
        const sut = create()
        // Act
        sut.downloadLatestTo('some-folder');
        // Assert
        expect(proxies.request.firstCall.args[1]).to.be.a('function');
      });
      describe('request handler function', () => {
        function getFirstRequestHandler(folder) {
          const sut = create();
          sut.downloadLatestTo(folder || 'some-folder');
          return proxies.request.firstCall.args[1];
        }

        describe('unhappy path', () => {
          // TODO
        });
        describe('happy path', () => {
          it('will attempt to download the href of the first anchor on the page with a .zip extension and no -src, starting with nunit', (done) => {
            // Arrange
            const body = `
            <html>
            <body>
              <a href="/nunit/nunit/releases/1.2.3/NUnit-1.2.3-src.zip">thingy</a>
              <a href="/nunit/nunit/releases/1.2.3/Nunit-1.2.3.zip">zip file</a>
              <a href="/nunit/nunit/releases/1.2.3/NUnit-1.2.3.npkg">nuget package</a>
              <a href="/nunit/nunit/releases/1.2.1/NUnit-1.2.3-src.zip">thingy</a>
              <a href="/nunit/nunit/releases/1.2.1/Nunit-1.2.3.zip">zip file</a>
              <a href="/nunit/nunit/releases/1.2.1/NUnit-1.2.3.npkg">nuget package</a>
            </body>
            </html>
            `;
            const fn = getFirstRequestHandler();
            // Act

            fn(null, {}, body);
            const
              providedBody = proxies.jsdom.env.firstCall.args[0],
              envHandler = proxies.jsdom.env.firstCall.args[1];
            expect(providedBody).to.equal(body);
            jsdom.env(providedBody, function (err, window) {
              // Assert
              envHandler(err, window);
              expect(proxies.request).to.have.been.calledTwice;
              expect(proxies.request.secondCall.args[0]).to.eql({
                  encoding: null, // NB! lets us download a binary without rubbish
                  url: 'https://github.com/nunit/nunit/releases/1.2.3/Nunit-1.2.3.zip'
                }
              );
              expect(proxies.request.secondCall.args[1]).to.be.a('function');
              done();
            })
            describe('nunit zip download handler', () => {
              var testFolder = 'test-dl-output';

              function getSecondRequestHandler() {
                const
                  body = '<html><body><a href="/nunit/nunit/releases/1.2.3/nunit-1.2.3.zip">GET IT</a></body></html>',
                  fn = getFirstRequestHandler(testFolder);

                fn(null, {}, body);
                const envHandler = proxis.jsdom.env.firstCall.args[1];
                return new Promise((resolve, reject) => {
                  jsdom.env(body, function (err, window) {
                    envHandler(err, window);
                    resolve(proxies.request.secondCall.args[1])
                  });
                })
              }

              beforeEach(() => {
                rimraf.sync(testFolder);
              });
              afterEach(() => {
                rimraf.sync(testFolder);
              })
              describe('sad path', () => {
                // TODO
              });
              // TODO: continue from here
              it.skip('will create the output folder if it doesn\'t exist', () => {
                // Arrange
                var
                  zip = createZip({
                    'file': new Buffer
                  }),
                  fn = getSecondRequestHandler();
                // Act
                expect(fs.existsSync(testFolder)).to.be.false;
                // fn('', {},
                // Assert
              });
            });
          });
        });
      });

    });
  });
});
