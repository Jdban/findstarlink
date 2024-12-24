// ==UserScript==
// @name         Toggle Starlink Features
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds a toggle checkbox to enable or disable highlighting and removal of Starlink cells on findstarlink.com with added functionality to ignore timings with a max degree of 20 or lower.
// @author       You
// @match        https://findstarlink.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const originalData = {};

    function processCells() {
        const entries = document.querySelectorAll('.timingEntry');
        const now = new Date();
        const toggleCheckbox = document.getElementById('starlinkToggle');

        entries.forEach((entry) => {
            const textContent = entry.textContent;
            const cellId = entry.dataset.cellId;
            const maxElevationMatch = textContent.match(/max: (\d+)��/i);

            if (!originalData.hasOwnProperty(cellId)) {
                // Store original data if not already stored
                originalData[cellId] = {
                    display: entry.style.display !== 'none' ? entry.style.display : 'block',
                    backgroundColor: entry.style.backgroundColor
                };
            }

            if (toggleCheckbox.checked && (textContent.includes('This may not be visible, based on recent user reports') || textContent.includes('(past)') || (maxElevationMatch && parseInt(maxElevationMatch[1], 10) <= 20))) {
                entry.style.display = 'none';
            } else {
                // Restore original data if the toggle is disabled
                entry.style.display = originalData[cellId].display;
                entry.style.backgroundColor = originalData[cellId].backgroundColor;
            }

            // Highlight cells with dates within the next 24 hours if the toggle is enabled
            const dateMatch = textContent.match(/(\d+:\d+ [ap]m, \d+ \w+ \d+)/i);

            if (toggleCheckbox.checked && dateMatch) {
                const entryDate = new Date(dateMatch[0]);

                if (isWithin24Hours(now, entryDate)) {
                    entry.style.backgroundColor = 'gray';
                }
            }
        });
    }

    function isWithin24Hours(date1, date2) {
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const diff = Math.abs(date1 - date2);
        return diff < millisecondsPerDay;
    }

    // Create a toggle checkbox
    const toggleCheckbox = document.createElement('input');
    toggleCheckbox.type = 'checkbox';
    toggleCheckbox.id = 'starlinkToggle';
    toggleCheckbox.checked = true; // Default the checkbox to enabled
    toggleCheckbox.addEventListener('change', processCells);

    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Ignore Past, Bad & Low Elevation: ';
    toggleLabel.appendChild(toggleCheckbox);

    // Add the toggle checkbox to the page
    const container = document.getElementById('resultsBox');
    container.insertBefore(toggleLabel, container.firstChild);

    // Use a MutationObserver to handle dynamic content on the page
    const observer = new MutationObserver(processCells);
    observer.observe(document.body, { childList: true, subtree: true });
})();
