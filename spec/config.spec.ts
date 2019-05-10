// The MIT License (MIT)
//
// Copyright (c) 2017 Firebase
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import * as mockRequire from 'mock-require';
import { expect } from 'chai';
import { config, firebaseConfig } from '../src/config';
import { resolve } from 'path';

describe('config()', () => {
  const runtimeConfigPath = resolve('.runtimeconfig.json');

  afterEach(() => {
    mockRequire.stopAll();
    delete config.singleton;
    delete process.env.FIREBASE_CONFIG;
    delete process.env.FIREBASE_PROJECT;
    delete process.env.CLOUD_RUNTIME_CONFIG;
  });

  it('loads config values from .runtimeconfig.json', () => {
    mockRequire(runtimeConfigPath, { foo: 'bar', firebase: {} });
    let loaded = config();
    expect(loaded).to.not.have.property('firebase');
    expect(loaded).to.have.property('foo', 'bar');
  });

  it('does not provide firebase config if .runtimeconfig.json not invalid', () => {
    mockRequire(runtimeConfigPath, 'does-not-exist');
    expect(firebaseConfig()).to.be.null;
  });

  it('does not provide firebase config if .ruuntimeconfig.json has no firebase property', () => {
    mockRequire(runtimeConfigPath, {});
    expect(firebaseConfig()).to.be.null;
  });

  it('loads Firebase configs from FIREBASE_PROJECT env variable', () => {
    process.env.FIREBASE_PROJECT = JSON.stringify({
      databaseURL: 'foo@firebaseio.com',
    });
    expect(firebaseConfig()).to.have.property(
      'databaseURL',
      'foo@firebaseio.com'
    );
  });

  it('loads Firebase configs from FIREBASE_CONFIG env variable', () => {
    process.env.FIREBASE_CONFIG = JSON.stringify({
      databaseURL: 'foo@firebaseio.com',
    });
    expect(firebaseConfig()).to.have.property(
      'databaseURL',
      'foo@firebaseio.com'
    );
  });

  it('prefers FIREBASE_CONFIG over FIREBASE_PROJECT', () => {
    process.env.FIREBASE_CONFIG = JSON.stringify({
      databaseURL: 'firebase_config',
    });
    process.env.FIREBASE_PROJECT = JSON.stringify({
      databaseURL: 'firebase_project',
    });
    expect(firebaseConfig()).to.have.property('databaseURL', 'firebase_config');
  });

  it('behaves well when both FIREBASE_PROJECT and .runtimeconfig.json present', () => {
    process.env.FIREBASE_PROJECT = JSON.stringify({
      databaseURL: 'foo@firebaseio.com',
    });
    mockRequire(runtimeConfigPath, {
      firebase: {
        databaseURL: 'foo@firebaseio.com',
      },
      foo: 'bar',
    });
    expect(firebaseConfig()).to.have.property(
      'databaseURL',
      'foo@firebaseio.com'
    );
    expect(config()).to.have.property('foo', 'bar');
  });

  it('accepts alternative locations for config file', () => {
    process.env.CLOUD_RUNTIME_CONFIG = 'another.json';
    mockRequire('another.json', { foo: 'bar', firebase: {} });
    expect(firebaseConfig()).to.not.be.null;
    expect(config()).to.have.property('foo', 'bar');
  });

  it('accepts full JSON in env.CLOUD_RUNTIME_CONFIG', () => {
    process.env.CLOUD_RUNTIME_CONFIG = JSON.stringify({
      foo: 'bar',
      firebase: {},
    });
    expect(firebaseConfig()).to.not.be.null;
    expect(config()).to.have.property('foo', 'bar');
  });

  it('behaves well when both env.CLOUD_RUNTIME_CONFIG and env.FIREBASE_PROJECT are set', () => {
    process.env.CLOUD_RUNTIME_CONFIG = JSON.stringify({ foo: 'bar' });
    process.env.FIREBASE_PROJECT = JSON.stringify({
      databaseURL: 'foo@firebaseio.com',
    });
    expect(firebaseConfig()).to.have.property(
      'databaseURL',
      'foo@firebaseio.com'
    );
    expect(config()).to.have.property('foo', 'bar');
  });
});
