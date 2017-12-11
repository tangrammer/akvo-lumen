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

const selectorTimeout = 10000;

let optionId;

let columnId;

let aggregationId;

(async () => {
  const browser = await puppeteer.launch({
    // You can uncomment the next line to see the browser
    // headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  const page = await browser.newPage();

  try {
    // Login
    console.log('\nSTARTING LUMEN ONLINE TEST WITH PUPPETEER\n');
    await page.setViewport({ width: 1024, height: 768 });
    console.log('Accessing to https://lumencitest.akvoest.org...');
    await page.goto('https://lumencitest.akvotest.org');
    await page.waitForSelector('#username', { timeout: selectorTimeout });
    console.log('Typing username...');
    await page.type('#username', username);
    console.log('Typing password...');
    await page.type('#password', password);
    console.log('Trying login...');
    await page.click('#kc-login');
    await page.waitForSelector('button[data-test-id="dataset"]', { timeout: selectorTimeout });
    console.log('Login was successful.\n');
    await page.evaluate(`window.__datasetName = "${datasetName}"`);

    // Dataset adding
    // Click Dataset+ option
    console.log('Accessing to dataset creation...');
    await page.click('button[data-test-id="dataset"]');
    await page.waitForSelector('button[data-test-id="next"]', { timeout: selectorTimeout });
    // Select link option
    console.log('Typing dataset link...');
    await page.click('input[data-test-id="source-option"][value="LINK"]');
    await page.click('button[data-test-id="next"]');
    await page.waitForSelector('#linkFileInput', { timeout: selectorTimeout });
    // Insert link
    await page.type('#linkFileInput', 'https://raw.githubusercontent.com/jokecamp/FootballData/master/other/stadiums-with-GPS-coordinates.csv');
    await page.click('button[data-test-id="next"]');
    await page.waitForSelector('input[data-test-id="dataset-name"]', { timeout: selectorTimeout });
    // Insert name
    console.log('Typing dataset name...');
    await page.type('input[data-test-id="dataset-name"]', datasetName);
    // Import
    console.log('Saving dataset...');
    await page.click('button[data-test-id="next"]');
    console.log(`Dataset ${datasetName} was successfully created.\n`);
    await page.waitForSelector(`[data-test-name="${datasetName}"]`);

    // Search of the ID
    console.log('Extracting dataset ID...');
    const id = await page.evaluate(() => {
      const found = document.querySelector(`[data-test-name="${__datasetName}"]`);
      return Promise.resolve(found.getAttribute('data-test-id'));
    });
    console.log(`ID extracted: ${id}\n`);
    let pending;
    const timeOut = setTimeout(() => { console.log('Error waiting for pending dataset'); process.exit(1); }, 15 * selectorTimeout);
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    do {
      await sleep(2000);
      pending = await page.$(`[data-test-name="${datasetName}"] [data-test-id="pending"]`);
      console.log('Pending...');
    } while (pending);
    clearTimeout(timeOut);

    // Modify dataset
    await page.click(`[data-test-name="${datasetName}"]`);
    // Delete columns
    await page.waitForSelector('[data-test-id="Capacity"]', { timeout: selectorTimeout });
    await page.click('[data-test-id="Capacity"]');
    await page.click('[data-test-id="context-menu"] li:nth-of-type(3)');
    await page.waitForSelector('[data-test-id="Stadium"]', { timeout: selectorTimeout });
    await page.click('[data-test-id="Stadium"]');
    await page.click('[data-test-id="context-menu"] li:nth-of-type(3)');
    await page.waitForSelector('[data-test-id="FDCOUK"]', { timeout: selectorTimeout });
    await page.click('[data-test-id="FDCOUK"]');
    await page.click('[data-test-id="context-menu"] li:nth-of-type(3)');
    // Create geopoints
    await page.click('[data-test-id="transform"]');
    console.log('Creating column of geopoints...');
    await page.click('li:nth-of-type(6)');
    console.log('Selecting latitudes...');
    await page.waitForSelector('label[for="columnNameLat"]+div', { timeout: selectorTimeout });
    await page.click('label[for="columnNameLat"]+div');
    const latitudeId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === 'Latitude');
      return Promise.resolve(found.id);
    });
    await page.click(`#${latitudeId}`);
    console.log('Selecting longitudes...');
    await page.waitForSelector('label[for="columnNameLong"]+div', { timeout: selectorTimeout });
    await page.click('label[for="columnNameLong"]+div');
    const longitudeId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === 'Longitude');
      return Promise.resolve(found.id);
    });
    await page.click(`#${longitudeId}`);
    console.log('Typing column name...');
    await page.type('[data-test-id="columnTitle"]', 'Geopoint');
    await page.click('[data-test-id="generate"]');
    await page.goto('https://lumencitest.akvotest.org');
    await page.waitForSelector('button[data-test-id="visualisation"]', { timeout: selectorTimeout });

    // Pivot table
    console.log('Accessing to visualisation creation...');
    await page.click('button[data-test-id="visualisation"]');
    console.log('Selecting pivot table option...');
    await page.waitForSelector('li[data-test-id="button-pivot-table"]', { timeout: selectorTimeout });
    await page.click('li[data-test-id="button-pivot-table"]');
    console.log('Selecting dataset...');
    await page.waitForSelector('[data-test-id="select-menu"]', { timeout: selectorTimeout });
    await page.click('[data-test-id="select-menu"]');
    await page.waitForSelector('[aria-expanded="true"]', { timeout: selectorTimeout });
    await page.evaluate(`window.__datasetName = "${datasetName}"`);
    optionId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === __datasetName);
      return Promise.resolve(found.id);
    });
    await page.click(`#${optionId}`);
    await sleep(3000);
    await page.waitForSelector('label[data-test-id="categoryColumnInput"]+div', { timeout: selectorTimeout });
    await page.click('label[data-test-id="categoryColumnInput"]+div');
    await page.waitForSelector('[aria-expanded="true"]', { timeout: selectorTimeout });
    console.log('Selecting columns...');
    columnId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === 'Country (text)');
      return Promise.resolve(found.id);
    });
    await page.click(`#${columnId}`);
    await page.click('div[data-test-id="entity-title"]');
    console.log('Typing visualisation name...');
    await page.type('input[data-test-id="entity-title"]', `PivotTable${datasetName}`);
    console.log('Saving visualisation...');
    await page.click('button[data-test-id="save-changes"]');
    console.log(`Pivot table ${datasetName} was successfully created.\n`);
    await page.goto('https://lumencitest.akvotest.org');
    await page.waitForSelector(`[data-test-name="${datasetName}"]`, { timeout: selectorTimeout });

     // Bar chart
    console.log('Accessing to visualisation creation...');
    await page.click('button[data-test-id="visualisation"]');
    console.log('Selecting bar chart option...');
    await page.waitForSelector('li[data-test-id="button-bar"]', { timeout: selectorTimeout });
    await page.click('li[data-test-id="button-bar"]');
    console.log('Selecting dataset...');
    await page.waitForSelector('[data-test-id="select-menu"]', { timeout: selectorTimeout });
    await page.click('[data-test-id="select-menu"]');
    await page.waitForSelector('[aria-expanded="true"]', { timeout: selectorTimeout });
    await page.evaluate(`window.__datasetName = "${datasetName}"`);
    optionId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === __datasetName);
      return Promise.resolve(found.id);
    });
    await page.click(`#${optionId}`);
    await sleep(3000);
    await page.waitForSelector('label[data-test-id="metricColumnYInput"]+div', { timeout: selectorTimeout });
    await page.click('label[data-test-id="metricColumnYInput"]+div');
    await page.waitForSelector('[aria-expanded="true"]', { timeout: selectorTimeout });
    console.log('Selecting columns...');
    columnId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === 'Team (text)');
      return Promise.resolve(found.id);
    });
    await page.click(`#${columnId}`);
    await page.waitForSelector('label[data-test-id="xGroupColumnMenu"]+div', { timeout: selectorTimeout });
    await page.click('label[data-test-id="xGroupColumnMenu"]+div');
    await page.waitForSelector('[aria-expanded="true"]', { timeout: selectorTimeout });
    console.log('Selecting columns...');
    columnId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === 'Country (text)');
      return Promise.resolve(found.id);
    });
    await page.click(`#${columnId}`);
    await page.click('label[data-test-id="yAggregationMenu"]+div');
    await page.waitForSelector('[aria-expanded="true"]', { timeout: selectorTimeout });
    console.log('Selecting aggregation type...');
    aggregationId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === 'Count');
      return Promise.resolve(found.id);
    });
    await page.click(`#${aggregationId}`);
    await page.click('div[data-test-id="entity-title"]');
    console.log('Typing bar chart name...');
    await page.type('input[data-test-id="entity-title"]', `BarChart${datasetName}`);
    console.log('Saving bar chart...');
    await page.click('button[data-test-id="save-changes"]');
    console.log(`Bar chart ${datasetName} was successfully created.\n`);
    await page.goto('https://lumencitest.akvotest.org');
    await page.waitForSelector(`[data-test-name="${datasetName}"]`, { timeout: selectorTimeout });

    // Pie chart
    console.log('Accessing to visualisation creation...');
    await page.click('button[data-test-id="visualisation"]');
    console.log('Selecting pie chart option...');
    await page.waitForSelector('li[data-test-id="button-pie"]', { timeout: selectorTimeout });
    await page.click('li[data-test-id="button-pie"]');
    console.log('Selecting dataset...');
    await page.waitForSelector('[data-test-id="select-menu"]', { timeout: selectorTimeout });
    await page.click('[data-test-id="select-menu"]');
    await page.waitForSelector('[aria-expanded="true"]', { timeout: selectorTimeout });
    await page.evaluate(`window.__datasetName = "${datasetName}"`);
    optionId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === __datasetName);
      return Promise.resolve(found.id);
    });
    await page.click(`#${optionId}`);
    await sleep(3000);
    await page.waitForSelector('label[data-test-id="xGroupColumnMenu"]+div', { timeout: selectorTimeout });
    await page.click('label[data-test-id="xGroupColumnMenu"]+div');
    await page.waitForSelector('[aria-expanded="true"]', { timeout: selectorTimeout });
    console.log('Selecting columns...');
    columnId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === 'Country (text)');
      return Promise.resolve(found.id);
    });
    await page.click(`#${columnId}`);
    await page.click('div[data-test-id="entity-title"]');
    console.log('Typing pie chart name...');
    await page.type('input[data-test-id="entity-title"]', `PieChart${datasetName}`);
    console.log('Saving pie chart...');
    await page.click('button[data-test-id="save-changes"]');
    console.log(`Pie chart ${datasetName} was successfully created.\n`);
    await page.goto('https://lumencitest.akvotest.org');
    await page.waitForSelector(`[data-test-name="${datasetName}"]`, { timeout: selectorTimeout });


    // Map
    console.log('Accessing to visualisation creation...');
    await page.click('button[data-test-id="visualisation"]');
    console.log('Selecting map option...');
    await page.waitForSelector('li[data-test-id="button-map"]', { timeout: selectorTimeout });
    await page.click('li[data-test-id="button-map"]');
    await page.click('[class^="addLayer"]');
    // We should change the line above and use a data-test-id
    // await page.waitForSelector('li[data-test-id="add-layer"]', { timeout: selectorTimeout });
    // await page.click('[data-test-id="add-layer"]');
    await page.click('[data-test-id="layer"]');
    console.log('Selecting dataset...');
    await page.waitForSelector('[data-test-id="source-dataset-select"]', { timeout: selectorTimeout });
    await page.click('[data-test-id="source-dataset-select"]');
    await page.evaluate(`window.__datasetName = "${datasetName}"`);
    const optionId2 = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === __datasetName);
      return Promise.resolve(found.id);
    });
    await page.click(`#${optionId2}`);
    console.log('Dataset selected.');
    await page.waitForSelector('[data-test-id="color-coding-select"]', { timeout: selectorTimeout });
    console.log('Placing geopoints on the map...');
    await sleep(3000);
    await page.click('[data-test-id="color-coding-select"]');
    console.log('Coloring geopoints...');
    const codingId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role="option"]');
      const options = Array.from(elements);
      const found = options.find(e => e.textContent === 'Country (text)');
      return Promise.resolve(found.id);
    });
    await page.click(`#${codingId}`);
    await page.click('div[data-test-id="entity-title"]');
    console.log('Typing map name...');
    await page.type('input[data-test-id="entity-title"]', `Map${datasetName}`);
    console.log('Saving map...');
    await page.click('[data-test-id="save-button"]');
    await page.goto('https://lumencitest.akvotest.org');
    await page.waitForSelector('[data-test-id="dashboard"]', { timeout: selectorTimeout });
    console.log(`Map ${datasetName} was successfully created.\n`);

    // Dashboard
    console.log('Accessing to dashboard creation...');
    await page.click('button[data-test-id="dashboard"]');
    console.log('Selecting visualisation...');
    await page.waitForSelector(`[data-test-name="Map${datasetName}"]`, { timeout: selectorTimeout });
    await page.click(`[data-test-name="Map${datasetName}"]`);
    console.log('Typing dashboard name...');
    await page.waitForSelector('[data-test-id="dashboard-canvas-item"]', { timeout: selectorTimeout });
    await page.click('div[data-test-id="entity-title"]');
    await page.type('input[data-test-id="entity-title"]', `Dashboard${datasetName}`);
    console.log('Saving dashboard...');
    await page.click('[data-test-id="save-changes"]');
    await page.click('[data-test-id="fa-arrow"]');
    await page.goto('https://lumencitest.akvotest.org');
    await page.waitForSelector(`[data-test-name="Dashboard${datasetName}"]`, { timeout: selectorTimeout });
    console.log(`Dashboard ${datasetName} was successfully created.\n`);

    // Dataset from flow adding
    // Click Dataset+ option
    console.log('Accessing to dataset creation...');
    await page.click('button[data-test-id="dataset"]');
    await page.waitForSelector('button[data-test-id="next"]', { timeout: selectorTimeout });
    // Select link option
    await page.click('input[data-test-id="source-option"][value="AKVO_FLOW"]');
    await page.click('button[data-test-id="next"]');
    await page.waitForSelector('[data-test-id="flow-url"]', { timeout: selectorTimeout });
    // Insert link
    console.log('Typing dataset link...');
    await page.type('[data-test-id="flow-url"]', 'uat1/akvoflow.org');
    console.log('Selecting data...');
    await sleep(5000);
    await page.type('[data-test-id="flow-url"]+div [role="combobox"]', '_Lumen tests');
    await page.keyboard.press('Enter');
    await sleep(5000);
    await page.type('[data-test-id="flow-url"]+div+div [role="combobox"]', 'All');
    await page.keyboard.press('Enter');
    await sleep(5000);
    await page.type('[data-test-id="flow-url"]+div+div+div [role="combobox"]', 'All');
    await page.keyboard.press('Enter');
    await page.click('button[data-test-id="next"]');
    await page.waitForSelector('input[data-test-id="dataset-name"]', { timeout: selectorTimeout });
    // Insert name
    await page.click('input[data-test-id="dataset-name"]');
    for (let i = 0; i < 18; i += 1) {
      await page.keyboard.press('Backspace');
    }
    await page.type('input[data-test-id="dataset-name"]', `AkvoFlow${datasetName}`);
    // Import
    console.log('Saving dataset...');
    await page.click('button[data-test-id="next"]');
    await page.waitForSelector(`[data-test-name="AkvoFlow${datasetName}"]`, { timeout: selectorTimeout });
    console.log(`Dataset from flow ${datasetName} was successfully created.\n`);

    console.log('THE ONLINE TEST WAS SUCCESSFUL');
  } catch (err) {
    console.log(`THE TEST FAILED\n${err}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
