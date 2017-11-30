/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global __datasetName */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-console */

const puppeteer = require('puppeteer');

const datasetName = Date.now().toString();

const username = process.env.USERNAME;

const password = process.env.PASSWORD;

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  const page = await browser.newPage();

  try {
    // Login
    console.log('\nSTARTING LUMEN TEST WITH PUPPETEER\n');
    await page.setViewport({ width: 1024, height: 768 });
    console.log('Accessing to lumencitest.akvotest.org...');
    await page.goto('http://lumencitest.akvotest.org');
    await page.waitForSelector('#username', { timeout: 10000 });
    console.log('Typing username...');
    await page.type('#username', username);
    console.log('Typing password...');
    await page.type('#password', password);
    console.log('Trying login...');
    await page.click('#kc-login');
    await page.waitForSelector('button[data-test-id="dataset"]', { timeout: 10000 });
    console.log('Login was successful.\n');

    // Dataset adding
    // Click Dataset+ option
    console.log('Accessing to dataset creation...');
    await page.click('button[data-test-id="dataset"]');
    await page.waitForSelector('button[data-test-id="next"]', { timeout: 10000 });
    // Select link option
    await page.click('input[data-test-id="source-option"][value="AKVO_FLOW"]');
    await page.click('button[data-test-id="next"]');
    await page.waitForSelector('[data-test-id="flow-url"]', { timeout: 10000 });
    // Insert link
    console.log('Typing dataset link...');
    await page.type('[data-test-id="flow-url"]', 'uat1/akvoflow.org');
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    console.log('Selecting data...');
    await sleep(3000);
    await page.type('[data-test-id="flow-url"]+div [role="combobox"]', '_Lumen tests');
    await page.keyboard.press('Enter');
    await sleep(3000);
    await page.type('[data-test-id="flow-url"]+div+div [role="combobox"]', 'All');
    await page.keyboard.press('Enter');
    await sleep(1000);
    await page.type('[data-test-id="flow-url"]+div+div+div [role="combobox"]', 'All');
    await page.keyboard.press('Enter');
    await page.click('button[data-test-id="next"]');
    await page.waitForSelector('input[data-test-id="dataset-name"]', { timeout: 10000 });
    // Insert name
    await page.type('input[data-test-id="dataset-name"]', datasetName);
    // Import
    console.log('Saving dataset...');
    await page.click('button[data-test-id="next"]');
    console.log(`Dataset from flow ${datasetName} was successfully created.\n`);
    await page.waitForSelector(`[data-test-name="${datasetName}All questions form"]`, { timeout: 10000 });

    console.log('THE TEST WAS SUCCESSFUL');
  } catch (err) {
    console.log(`THE TEST FAILED\n${err}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
