/**
 * =============================================
 *  Cache Service Wrapper — Google Apps Script
 *  Efficient caching to minimize Sheet reads
 * =============================================
 */

/**
 * Get data from cache, or fetch from sheet and cache
 *
 * @param {string} sheetName - Sheet name to read
 * @param {number} ttl - Cache TTL in seconds (default: CONFIG.CACHE_TTL)
 * @returns {Array} Array of data objects
 */
function getCachedSheetData(sheetName, ttl) {
  var cacheTTL = ttl || CONFIG.CACHE_TTL;
  var cacheKey = 'sheet_' + sheetName;
  var cache = CacheService.getScriptCache();

  // Try cache first
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Cache corrupted, fall through
    }
  }

  // Read from sheet
  var data = readSheetDataFresh(sheetName);

  // Store in cache
  try {
    var jsonStr = JSON.stringify(data);
    // CacheService has a 100KB limit per item
    if (jsonStr.length < 100000) {
      cache.put(cacheKey, jsonStr, cacheTTL);
    } else {
      // For large datasets, chunk the cache
      chunkCache(cache, cacheKey, jsonStr, cacheTTL);
    }
  } catch (e) {
    Logger.log('Cache write error: ' + e.message);
  }

  return data;
}

/**
 * Read sheet data without cache
 */
function readSheetDataFresh(sheetName) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      obj[h] = row[i];
    });
    return obj;
  }).filter(function(row) {
    return Object.values(row).some(function(v) {
      return v !== '' && v !== null && v !== undefined;
    });
  });
}

/**
 * Store large data in multiple cache chunks
 */
function chunkCache(cache, baseKey, jsonStr, ttl) {
  var CHUNK_SIZE = 90000; // Stay under 100KB limit
  var chunks = Math.ceil(jsonStr.length / CHUNK_SIZE);

  // Store chunk count
  cache.put(baseKey + '_chunks', String(chunks), ttl);

  for (var i = 0; i < chunks; i++) {
    var chunk = jsonStr.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    cache.put(baseKey + '_chunk_' + i, chunk, ttl);
  }
}

/**
 * Read large data from multiple cache chunks
 */
function readChunkedCache(cache, baseKey) {
  var chunksStr = cache.get(baseKey + '_chunks');
  if (!chunksStr) return null;

  var chunks = parseInt(chunksStr);
  var parts = [];

  for (var i = 0; i < chunks; i++) {
    var chunk = cache.get(baseKey + '_chunk_' + i);
    if (!chunk) return null; // Incomplete cache
    parts.push(chunk);
  }

  try {
    return JSON.parse(parts.join(''));
  } catch (e) {
    return null;
  }
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  var cache = CacheService.getScriptCache();
  var sheets = Object.values(CONFIG.SHEETS);

  sheets.forEach(function(sheetName) {
    cache.remove('sheet_' + sheetName);

    // Also clear chunked cache
    var chunksStr = cache.get('sheet_' + sheetName + '_chunks');
    if (chunksStr) {
      var chunks = parseInt(chunksStr);
      for (var i = 0; i < chunks; i++) {
        cache.remove('sheet_' + sheetName + '_chunk_' + i);
      }
      cache.remove('sheet_' + sheetName + '_chunks');
    }
  });

  Logger.log('All caches cleared');
  return { success: true, message: 'All caches cleared' };
}

/**
 * Scheduled cache refresh (set up with time-based trigger)
 */
function scheduledCacheRefresh() {
  clearAllCaches();

  // Pre-warm cache by reading all sheets
  Object.values(CONFIG.SHEETS).forEach(function(sheetName) {
    try {
      getCachedSheetData(sheetName, CONFIG.CACHE_TTL);
      Logger.log('Cache warmed for: ' + sheetName);
    } catch (e) {
      Logger.log('Cache warm failed for ' + sheetName + ': ' + e.message);
    }
  });

  Logger.log('Scheduled cache refresh complete');
}

/**
 * Set up time-based trigger for cache refresh
 * Run this once manually to enable auto-refresh
 */
function setupScheduledRefresh() {
  // Delete existing triggers for this function
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'scheduledCacheRefresh') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger: every 5 minutes
  ScriptApp.newTrigger('scheduledCacheRefresh')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Scheduled refresh trigger created (every 5 minutes)');
  return { success: true, message: 'Trigger created' };
}
