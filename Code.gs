/**
 * AI-POWERED MARKETING INTELLIGENCE
 * Public portfolio version.
 *
 * This repository is intentionally anonymized.
 * Replace Example Company values with your own organization settings.
 * Store all credentials in Apps Script Script Properties.
 * Never commit real API keys, webhook URLs, tokens, or private endpoints.
 */

const GOOGLE_CHAT_WEBHOOK =
  PropertiesService.getScriptProperties().getProperty('GOOGLE_CHAT_WEBHOOK');

const GA4_PROPERTY_ID = 'YOUR_GA4_PROPERTY_ID';

const SEARCH_CONSOLE_SITE = 'https://www.example.com/';

const PREVIOUS_MONTH_BOOKINGS_URL =
  PropertiesService.getScriptProperties().getProperty('PREVIOUS_MONTH_BOOKINGS_URL') ||
  'https://api.example.com/bookings';

const STRATEGIC_SEARCH_THEMES = [
  {
    name: 'Enterprise AI Automation',
    representativeQueries: ['enterprise ai', 'ai workflow automation', 'ai orchestration', 'enterprise ai platform', 'ai operations'],
    searchTerms: ['enterprise ai', 'ai workflow automation', 'ai orchestration', 'enterprise ai platform', 'ai operations']
  },
  {
    name: 'AI Reasoning Models',
    representativeQueries: ['reasoning model', 'non reasoning model', 'thinking model', 'llm reasoning', 'model reasoning'],
    searchTerms: ['reasoning model', 'non reasoning model', 'thinking model', 'llm reasoning', 'model reasoning']
  },
  {
    name: 'Customer Experience AI',
    representativeQueries: ['customer experience ai', 'customer support ai', 'ai service automation', 'customer workflow ai', 'ai experience platform'],
    searchTerms: ['customer experience ai', 'customer support ai', 'ai service automation', 'customer workflow ai', 'ai experience platform']
  },
  {
    name: 'Risk & Compliance AI',
    representativeQueries: ['compliance ai', 'risk automation', 'ai governance', 'compliance automation', 'risk monitoring ai'],
    searchTerms: ['compliance ai', 'risk automation', 'ai governance', 'compliance automation', 'risk monitoring ai']
  },
  {
    name: 'Document Automation',
    representativeQueries: ['document automation', 'ai document generation', 'structured content automation', 'automated documentation', 'content workflow'],
    searchTerms: ['document automation', 'ai document generation', 'structured content automation', 'automated documentation', 'content workflow']
  },
  {
    name: 'Commercial AI',
    representativeQueries: ['commercial ai', 'ai go to market', 'ai marketing operations', 'ai revenue operations', 'commercial automation'],
    searchTerms: ['commercial ai', 'ai go to market', 'ai marketing operations', 'ai revenue operations', 'commercial automation']
  }
];

function sendMonthlyReport() {
  seed2026Baseline();

  const bookingsData = fetchJson(PREVIOUS_MONTH_BOOKINGS_URL);

  const reportMonthLabel = getReportMonthLabel(bookingsData);
  const reportMonthStart = parseMonthLabelToDate(reportMonthLabel);
  const reportMonthEndExclusive = new Date(reportMonthStart.getFullYear(), reportMonthStart.getMonth() + 1, 1);

  const comparisonMonthStart = new Date(reportMonthStart.getFullYear(), reportMonthStart.getMonth() - 1, 1);
  const comparisonMonthEndExclusive = reportMonthStart;
  const comparisonMonthKey = getMonthKey(comparisonMonthStart);
  const reportMonthLabelUpper = reportMonthLabel.toUpperCase();

  const currentDemoMetrics = getBookingMetrics(getBookingsArray(bookingsData));
  const comparisonDemoMetrics = getStoredMonthlyDemoMetrics(comparisonMonthKey);

  saveMonthlySnapshot(reportMonthStart, currentDemoMetrics);

  const ytdMetrics = getYtdDemoMetrics(reportMonthStart);

  const currentTraffic = getGa4Metrics(
    GA4_PROPERTY_ID,
    reportMonthStart,
    reportMonthEndExclusive
  );

  const comparisonTraffic = getGa4Metrics(
    GA4_PROPERTY_ID,
    comparisonMonthStart,
    comparisonMonthEndExclusive
  );

  const totalDemos = currentDemoMetrics.categoryA + currentDemoMetrics.categoryB;
  const previousTotalDemos = comparisonDemoMetrics.categoryA + comparisonDemoMetrics.categoryB;

  const demoConversionRatio =
    currentTraffic.engagedSessions > 0
      ? (totalDemos / currentTraffic.engagedSessions) * 100
      : 0;

  const previousDemoConversionRatio =
    comparisonTraffic.engagedSessions > 0
      ? (previousTotalDemos / comparisonTraffic.engagedSessions) * 100
      : null;

  const demoAcquisitionEfficiencyRatio =
    currentTraffic.newUsers > 0
      ? (totalDemos / currentTraffic.newUsers) * 100
      : 0;

  const previousDemoAcquisitionEfficiencyRatio =
    comparisonTraffic.newUsers > 0
      ? (previousTotalDemos / comparisonTraffic.newUsers) * 100
      : null;

  const newToReturningRatio =
    currentTraffic.returningUsers > 0
      ? currentTraffic.newUsers / currentTraffic.returningUsers
      : 0;

  const currentSearchRows = getSearchConsoleRows(
    reportMonthStart,
    new Date(reportMonthEndExclusive.getTime() - 86400000),
    25000
  );

  const previousSearchRows = getSearchConsoleRows(
    comparisonMonthStart,
    new Date(comparisonMonthEndExclusive.getTime() - 86400000),
    25000
  );

  let message = '';

  message += '*' + reportMonthLabelUpper + ' DEMO TOTALS*\n\n';
  message += '1. Category A: ' + currentDemoMetrics.categoryA + formatDemoLineSuffix(currentDemoMetrics.categoryA, comparisonDemoMetrics.categoryA, ytdMetrics.categoryAYTD) + '\n';
  message += '2. Category B: ' + currentDemoMetrics.categoryB + formatDemoLineSuffix(currentDemoMetrics.categoryB, comparisonDemoMetrics.categoryB, ytdMetrics.categoryBYTD) + '\n\n\n';

  message += '*' + reportMonthLabelUpper + ' WEBSITE TRAFFIC TOTALS*\n\n';
  message += '1. Sessions: ' + currentTraffic.sessions + formatMoMPercent(currentTraffic.sessions, comparisonTraffic.sessions) + '\n';
  message += '2. Engaged sessions: ' + currentTraffic.engagedSessions + formatMoMPercent(currentTraffic.engagedSessions, comparisonTraffic.engagedSessions) + '\n';
  message += '3. New users: ' + currentTraffic.newUsers + formatMoMPercent(currentTraffic.newUsers, comparisonTraffic.newUsers) + '\n';
  message += '4. Returning users: ' + currentTraffic.returningUsers + formatMoMPercent(currentTraffic.returningUsers, comparisonTraffic.returningUsers) + '\n';
  message += '5. Search: ' + currentTraffic.search + formatMoMPercent(currentTraffic.search, comparisonTraffic.search) + '\n';
  message += '6. Direct: ' + currentTraffic.direct + formatMoMPercent(currentTraffic.direct, comparisonTraffic.direct) + '\n';
  message += '7. Paid: ' + currentTraffic.paid + formatMoMPercent(currentTraffic.paid, comparisonTraffic.paid) + '\n';
  message += '8. Referral: ' + currentTraffic.referral + formatMoMPercent(currentTraffic.referral, comparisonTraffic.referral) + '\n';
  message += '9. Other: ' + currentTraffic.other + formatMoMPercent(currentTraffic.other, comparisonTraffic.other) + '\n\n\n';

  message += '*' + reportMonthLabelUpper + ' WEBSITE PERFORMANCE*\n\n';
  message += '1. Demo conversion ratio (' + totalDemos + ' total demos / ' + currentTraffic.engagedSessions + ' total engaged sessions): ' + demoConversionRatio.toFixed(2) + '%' + formatMoMPercentValue(demoConversionRatio, previousDemoConversionRatio) + '\n';
  message += '2. Demo acquisition efficiency ratio (' + totalDemos + ' total demos / ' + currentTraffic.newUsers + ' total new users): ' + demoAcquisitionEfficiencyRatio.toFixed(2) + '%' + formatMoMPercentValue(demoAcquisitionEfficiencyRatio, previousDemoAcquisitionEfficiencyRatio) + '\n';
  message += '3. New-to-returning user ratio: ' + newToReturningRatio.toFixed(2) + 'x (' + getNewToReturningContext(newToReturningRatio) + '; ' + currentTraffic.newUsers + ' new users / ' + currentTraffic.returningUsers + ' returning users)\n\n\n';

  const strategicSearchThemesSection =
    buildStrategicSearchThemesSection(
      reportMonthLabelUpper,
      currentSearchRows,
      previousSearchRows
    );

  const topSearchEngagementSection =
    buildHighestGrowthQueriesSection(
      reportMonthLabelUpper,
      currentSearchRows,
      previousSearchRows
    );

  message += strategicSearchThemesSection;
  message += '\n\n';
  message += topSearchEngagementSection;

  const geminiSummaryContext =
    buildGeminiSummaryContext(
      reportMonthLabelUpper,
      currentDemoMetrics,
      comparisonDemoMetrics,
      ytdMetrics,
      currentTraffic,
      comparisonTraffic,
      totalDemos,
      demoConversionRatio,
      previousDemoConversionRatio,
      demoAcquisitionEfficiencyRatio,
      previousDemoAcquisitionEfficiencyRatio,
      newToReturningRatio,
      strategicSearchThemesSection,
      topSearchEngagementSection
    );

  const geminiTopSections =
    generateGeminiTopSections(
      geminiSummaryContext
    );

  const finalMessage =
    geminiTopSections + '\n\n━━━━━━━\n\n' + message;

  UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ text: finalMessage })
  });

  Logger.log(finalMessage);
}

function fetchJson(url) {
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const body = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('JSON endpoint failed with status ' + statusCode + ': ' + body);
  }

  return JSON.parse(body);
}

function getReportMonthLabel(data) {
  if (data && data.month) {
    return data.month;
  }

  const today = new Date();
  const reportMonthDate = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );

  return Utilities.formatDate(reportMonthDate, Session.getScriptTimeZone(), 'MMMM yyyy');
}

function getBookingsArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.bookings)) {
    return data.bookings;
  }

  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
}

function getBookingMetrics(bookings) {
  const latestByDemoKey = {};

  bookings.forEach(function (booking) {
    const demoKey = getDemoKey(booking);
    const demoDate = parseBookingDate(booking);

    if (!demoKey || !demoDate) return;

    if (!latestByDemoKey[demoKey] || demoDate > latestByDemoKey[demoKey].demoDate) {
      latestByDemoKey[demoKey] = {
        booking: booking,
        demoDate: demoDate
      };
    }
  });

  let categoryA = 0;
  let categoryB = 0;

  Object.values(latestByDemoKey).forEach(function (item) {
    const meetingType = normalizeMeetingType(
      item.booking.meeting_type ||
      item.booking.category ||
      item.booking.type ||
      item.booking.product ||
      item.booking.solution
    );

    if (meetingType === 'category_a') {
      categoryA++;
    }

    if (meetingType === 'category_b') {
      categoryB++;
    }
  });

  return {
    categoryA: categoryA,
    categoryB: categoryB,
    total: categoryA + categoryB
  };
}

function getDemoKey(booking) {
  const email = String(booking.email || '').trim().toLowerCase();
  const fullName = String(booking.full_name || booking.name || '').trim().toLowerCase();
  const organization = String(booking.organization || booking.company || '').trim().toLowerCase();
  const meetingType = String(booking.meeting_type || booking.category || booking.type || '').trim().toLowerCase();

  if (email) {
    return email + '|' + meetingType;
  }

  return fullName + '|' + organization + '|' + meetingType;
}

function parseBookingDate(booking) {
  if (!booking) {
    return null;
  }

  const rawDate = String(booking.date || booking.start_date || booking.datetime || '').trim();

  if (!rawDate) {
    return null;
  }

  const rawTime = String(booking.time || '00:00:00').trim();
  const parsed = rawDate.indexOf('T') >= 0 ? new Date(rawDate) : new Date(rawDate + 'T' + rawTime);

  return isNaN(parsed) ? null : parsed;
}

function normalizeMeetingType(value) {
  const type = String(value || '').trim().toLowerCase();

  if (type === 'category_a') return 'category_a';
  if (type === 'category_b') return 'category_b';

  return 'other';
}


function saveMonthlySnapshot(monthStartDate, metrics) {
  const props = PropertiesService.getScriptProperties();
  const key = 'DEMO_MONTHLY_SNAPSHOTS';
  const monthKey = getMonthKey(monthStartDate);

  const raw = props.getProperty(key);
  const store = raw ? JSON.parse(raw) : {};

  store[monthKey] = {
    categoryA: Number(metrics.categoryA || 0),
    categoryB: Number(metrics.categoryB || 0)
  };

  props.setProperty(key, JSON.stringify(store));
}

function getStoredMonthlyDemoMetrics(monthKey) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('DEMO_MONTHLY_SNAPSHOTS');
  const store = raw ? JSON.parse(raw) : {};

  if (!store[monthKey]) {
    return {
      categoryA: 0,
      categoryB: 0,
      total: 0
    };
  }

  return {
    categoryA: Number(store[monthKey].categoryA || 0),
    categoryB: Number(store[monthKey].categoryB || 0),
    total:
      Number(store[monthKey].categoryA || 0) +
      Number(store[monthKey].categoryB || 0)
  };
}

function getYtdDemoMetrics(reportMonthStart) {
  const props = PropertiesService.getScriptProperties();

  const baselineRaw = props.getProperty('DEMO_YTD_BASELINE');
  const baselineStore = baselineRaw ? JSON.parse(baselineRaw) : {};

  const snapshotsRaw = props.getProperty('DEMO_MONTHLY_SNAPSHOTS');
  const snapshotsStore = snapshotsRaw ? JSON.parse(snapshotsRaw) : {};

  const year = String(reportMonthStart.getFullYear());
  const reportMonthKey = getMonthKey(reportMonthStart);

  let categoryAYTD = 0;
  let categoryBYTD = 0;
  let baselineThroughMonth = null;

  if (baselineStore[year]) {
    baselineThroughMonth = baselineStore[year].throughMonth;
    categoryAYTD += Number(baselineStore[year].categoryA || 0);
    categoryBYTD += Number(baselineStore[year].categoryB || 0);
  }

  Object.keys(snapshotsStore).forEach(function (monthKey) {
    if (monthKey.indexOf(year + '-') !== 0) return;
    if (monthKey > reportMonthKey) return;
    if (baselineThroughMonth && monthKey <= baselineThroughMonth) return;

    categoryAYTD += Number(snapshotsStore[monthKey].categoryA || 0);
    categoryBYTD += Number(snapshotsStore[monthKey].categoryB || 0);
  });

  return {
    categoryAYTD: categoryAYTD,
    categoryBYTD: categoryBYTD
  };
}

function getGa4Metrics(propertyId, startDateObj, endDateObjExclusive) {
  const tz = Session.getScriptTimeZone();

  const startDate = Utilities.formatDate(startDateObj, tz, 'yyyy-MM-dd');
  const endDate = Utilities.formatDate(
    new Date(endDateObjExclusive.getTime() - 86400000),
    tz,
    'yyyy-MM-dd'
  );

  const endpoint =
    'https://analyticsdata.googleapis.com/v1beta/properties/' +
    propertyId +
    ':runReport';

  const payload = {
    dateRanges: [{ startDate: startDate, endDate: endDate }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [
      { name: 'sessions' },
      { name: 'engagedSessions' },
      { name: 'newUsers' },
      { name: 'totalUsers' }
    ],
    limit: 100
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const body = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('GA4 request failed with status ' + statusCode + ': ' + body);
  }

  const report = JSON.parse(body);

  let search = 0;
  let direct = 0;
  let paid = 0;
  let referral = 0;
  let other = 0;
  let sessions = 0;
  let engagedSessions = 0;
  let newUsers = 0;
  let totalUsers = 0;

  (report.rows || []).forEach(function (row) {
    const channel = row.dimensionValues[0].value;

    const rowSessions = Number(row.metricValues[0].value || 0);
    const rowEngagedSessions = Number(row.metricValues[1].value || 0);
    const rowNewUsers = Number(row.metricValues[2].value || 0);
    const rowTotalUsers = Number(row.metricValues[3].value || 0);

    sessions += rowSessions;
    engagedSessions += rowEngagedSessions;
    newUsers += rowNewUsers;
    totalUsers += rowTotalUsers;

    if (channel === 'Organic Search') {
      search += rowSessions;
    } else if (channel === 'Direct') {
      direct += rowSessions;
    } else if (
      channel === 'Paid Search' ||
      channel === 'Paid Social' ||
      channel === 'Paid Video' ||
      channel === 'Display' ||
      channel === 'Cross-network'
    ) {
      paid += rowSessions;
    } else if (channel === 'Referral') {
      referral += rowSessions;
    } else {
      other += rowSessions;
    }
  });

  return {
    sessions: sessions,
    engagedSessions: engagedSessions,
    newUsers: newUsers,
    returningUsers: Math.max(totalUsers - newUsers, 0),
    search: search,
    direct: direct,
    paid: paid,
    referral: referral,
    other: other
  };
}


function getSearchConsoleRows(startDate, endDate, rowLimit) {
  const endpoint =
    'https://www.googleapis.com/webmasters/v3/sites/' +
    encodeURIComponent(SEARCH_CONSOLE_SITE) +
    '/searchAnalytics/query';

  const payload = {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ['query'],
    rowLimit: rowLimit || 25000
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const body = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Search Console request failed with status ' + statusCode + ': ' + body);
  }

  const data = JSON.parse(body);

  return data.rows || [];
}

function buildStrategicSearchThemesSection(reportMonthLabelUpper, currentRows, previousRows) {
  let message = '';

  message += '*' + reportMonthLabelUpper + ' STRATEGIC SEARCH THEMES*\n\n';
  message += 'These "themes" measure whether Example Company is building search authority in the strategic categories it aims to own.\n\n';

  const results = [];

  STRATEGIC_SEARCH_THEMES.forEach(function (theme) {
    const metrics = calculateThemeMetrics(theme.searchTerms, currentRows);
    const previousMetrics = calculateThemeMetrics(theme.searchTerms, previousRows || []);

    if (metrics.impressions < 25) return;

    results.push({
      name: theme.name,
      representativeQueries: theme.representativeQueries,
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      ctr: metrics.ctr,
      position: metrics.position,
      previousClicks: previousMetrics.clicks,
      previousImpressions: previousMetrics.impressions
    });
  });

  if (results.length === 0) {
    return message + 'No qualifying search themes this month.';
  }

  results
    .sort(function (a, b) { return b.impressions - a.impressions; })
    .slice(0, 10)
    .forEach(function (item, index) {
      message += (index + 1) + '. ' + item.name + ' (representative queries include: ' + item.representativeQueries.join(', ') + ')\n';
      message += 'Impressions: ' + item.impressions + ' ' + formatMoMCountLabel(item.impressions, item.previousImpressions) + '\n';
      message += 'Clicks: ' + item.clicks + ' ' + formatMoMCountLabel(item.clicks, item.previousClicks) + '\n';
      message += 'CTR: ' + item.ctr.toFixed(1) + '%\n';
      message += 'Average Google search results position: ' + item.position.toFixed(1) + '\n\n';
    });

  return message.trim();
}

function calculateThemeMetrics(searchTerms, rows) {
  let totalClicks = 0;
  let totalImpressions = 0;
  let weightedCtr = 0;
  let weightedPosition = 0;

  rows.forEach(function (row) {
    const query = String(row.keys[0] || '').toLowerCase();

    const matches = searchTerms.some(function (term) {
      return query.indexOf(String(term).toLowerCase()) >= 0;
    });

    if (!matches) {
      return;
    }

    const clicks = Number(row.clicks || 0);
    const impressions = Number(row.impressions || 0);
    const ctr = Number(row.ctr || 0);
    const position = Number(row.position || 0);

    totalClicks += clicks;
    totalImpressions += impressions;
    weightedCtr += ctr * impressions;
    weightedPosition += position * impressions;
  });

  return {
    clicks: Math.round(totalClicks),
    impressions: Math.round(totalImpressions),
    ctr: totalImpressions > 0 ? (weightedCtr / totalImpressions) * 100 : 0,
    position: totalImpressions > 0 ? weightedPosition / totalImpressions : 0
  };
}

function buildHighestGrowthQueriesSection(reportMonthLabelUpper, currentRows, previousRows) {
  let message = '';

  message += '\n*' + reportMonthLabelUpper + ' TOP SEARCH ENGAGEMENT THEMES*\n\n';
  message += 'These "themes" measure the non-branded search intents generating the strongest user engagement across Example Company SEO footprint.\n\n';

  const candidateQueries = getTopSearchEngagementQueryCandidates(currentRows, previousRows);

  if (candidateQueries.length === 0) {
    return message + 'No qualifying search engagement themes this month.';
  }

  const groupedThemesResponse = generateSearchEngagementThemes(candidateQueries);

  if (!groupedThemesResponse.ok) {
    return (
      message +
      'Gemini search engagement themes could not be generated.\n\n' +
      'Error Message:\n\n' +
      groupedThemesResponse.error
    );
  }

  const groupedThemeMetrics =
    aggregateSearchEngagementThemeMetrics(
      groupedThemesResponse.themes,
      candidateQueries
    );

  if (groupedThemeMetrics.length === 0) {
    return (
      message +
      'Gemini search engagement themes could not be generated.\n\n' +
      'Error Message:\n\n' +
      'Gemini returned no usable grouped themes.'
    );
  }

  groupedThemeMetrics
    .sort(function (a, b) {
      if (b.clicks !== a.clicks) {
        return b.clicks - a.clicks;
      }

      return b.ctr - a.ctr;
    })
    .slice(0, 10)
    .forEach(function (item, index) {
      message += (index + 1) + '. ' + item.name + '\n';
      message += 'Representative queries: ' + item.queries.join(', ') + '\n';
      message += 'Impressions: ' + Math.round(item.impressions) + ' ' + formatMoMCountLabel(item.impressions, item.previousImpressions) + '\n';
      message += 'Clicks: ' + Math.round(item.clicks) + ' ' + formatMoMCountLabel(item.clicks, item.previousClicks) + '\n';
      message += 'CTR: ' + item.ctr.toFixed(1) + '%\n';
      message += 'Average Google search results position: ' + item.position.toFixed(1) + '\n\n';
    });

  return message.trim();
}

function getTopSearchEngagementQueryCandidates(currentRows, previousRows) {
  const previousMap = {};

  previousRows.forEach(function (row) {
    const query = String(row.keys[0] || '').toLowerCase();

    previousMap[query] = {
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0)
    };
  });

  return currentRows
    .map(function (row) {
      const query = String(row.keys[0] || '');
      const queryKey = query.toLowerCase();

      const clicks = Number(row.clicks || 0);
      const impressions = Number(row.impressions || 0);

      if (clicks <= 0) {
        return null;
      }

      if (isCompanyBrandedQuery(query)) {
        return null;
      }

      if (!isReadableSearchQuery(query)) {
        return null;
      }

      const previous = previousMap[queryKey] || {
        clicks: 0,
        impressions: 0
      };

      return {
        query: query,
        queryKey: queryKey,
        clicks: clicks,
        impressions: impressions,
        ctr: Number(row.ctr || 0) * 100,
        position: Number(row.position || 0),
        previousClicks: previous.clicks,
        previousImpressions: previous.impressions
      };
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return b.clicks - a.clicks;
    })
    .slice(0, 30);
}


function isCompanyBrandedQuery(query) {
  const normalizedQuery = String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const brandPatterns = [
    'examplecompany',
    'exampleco',
    'examplecorp',
    'examplcompany',
    'examplecompny',
    'exmplecompany',
    'examplecompanyai',
    'examplecompanycom'
  ];

  return brandPatterns.some(function (term) {
    return normalizedQuery.indexOf(term) >= 0;
  });
}


function isReadableSearchQuery(query) {
  const value = String(query || '').trim();

  if (value.length < 2) {
    return false;
  }

  if (/[^a-zA-Z0-9\s\.\-\/&]/.test(value)) {
    return false;
  }

  if (/[bcdfghjklmnpqrstvwxyz]{7,}/i.test(value)) {
    return false;
  }

  return true;
}


function generateSearchEngagementThemes(candidateQueries) {
  const apiKey =
    PropertiesService
      .getScriptProperties()
      .getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    return {
      ok: false,
      error: 'GEMINI_API_KEY is not configured.'
    };
  }

  const queryList =
    candidateQueries
      .map(function (item) {
        return item.query;
      });

  const prompt =
    'You are grouping Google Search Console queries for an executive SEO report for Example Company. Your goal is to identify when multiple search queries represent the same underlying user intent, even if the wording differs. Group semantically similar queries together into a single theme. Examples of queries that SHOULD be grouped together: reasoning llm vs non reasoning llm, reasoning models vs non reasoning models, thinking vs non thinking models, non reasoning model, difference between reasoning and non reasoning models. These are all the same underlying intent and should become one theme. Rules: Group by semantic meaning and user intent, not exact wording. Do not create more than 10 themes. Use concise executive-readable theme names. Theme names should be 2 to 6 words maximum. Do not invent queries. Do not modify query text. Every query must appear in exactly one theme. Do not create single-query themes unless absolutely necessary. Focus on consolidating similar intent variations aggressively. Return ONLY valid JSON in this exact format: {"themes":[{"name":"AI Reasoning Models","queries":["reasoning llm vs non reasoning llm","thinking vs non thinking models","difference between reasoning and non reasoning models"]}]} Queries: ' +
    JSON.stringify(queryList);

  const response =
    fetchGeminiResponseWithFallback(
      apiKey,
      prompt
    );

  if (!response.ok) {
    return {
      ok: false,
      error: response.body
    };
  }

  let parsedResponse;

  try {
    parsedResponse = JSON.parse(response.body);
  } catch (e) {
    return {
      ok: false,
      error: response.body
    };
  }

  if (
    !parsedResponse.candidates ||
    !parsedResponse.candidates[0] ||
    !parsedResponse.candidates[0].content ||
    !parsedResponse.candidates[0].content.parts ||
    !parsedResponse.candidates[0].content.parts[0] ||
    !parsedResponse.candidates[0].content.parts[0].text
  ) {
    return {
      ok: false,
      error: response.body
    };
  }

  const rawText =
    parsedResponse.candidates[0]
      .content.parts[0]
      .text
      .trim();

  const jsonText =
    extractJsonObject(rawText);

  let themeData;

  try {
    themeData = JSON.parse(jsonText);
  } catch (e) {
    return {
      ok: false,
      error: rawText
    };
  }

  if (!themeData.themes || !Array.isArray(themeData.themes)) {
    return {
      ok: false,
      error: rawText
    };
  }

  return {
    ok: true,
    themes: themeData.themes
  };
}

function aggregateSearchEngagementThemeMetrics(themes, candidateQueries) {
  const queryMap = {};

  candidateQueries.forEach(function (item) {
    queryMap[item.query.toLowerCase()] = item;
  });

  const usedQueries = {};

  return themes
    .map(function (theme) {
      const includedQueries = [];
      let impressions = 0;
      let clicks = 0;
      let previousImpressions = 0;
      let previousClicks = 0;
      let weightedCtr = 0;
      let weightedPosition = 0;

      (theme.queries || []).forEach(function (query) {
        const key = String(query || '').toLowerCase();
        const item = queryMap[key];

        if (!item || usedQueries[key]) {
          return;
        }

        usedQueries[key] = true;
        includedQueries.push(item.query);

        impressions += item.impressions;
        clicks += item.clicks;
        previousImpressions += item.previousImpressions;
        previousClicks += item.previousClicks;
        weightedCtr += item.ctr * item.impressions;
        weightedPosition += item.position * item.impressions;
      });

      if (includedQueries.length === 0) {
        return null;
      }

      return {
        name: sanitizeThemeName(theme.name),
        queries: includedQueries,
        impressions: impressions,
        clicks: clicks,
        previousImpressions: previousImpressions,
        previousClicks: previousClicks,
        ctr: impressions > 0 ? weightedCtr / impressions : 0,
        position: impressions > 0 ? weightedPosition / impressions : 0
      };
    })
    .filter(Boolean);
}

function extractJsonObject(value) {
  const text = String(value || '').trim();

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return text;
  }

  return text.substring(firstBrace, lastBrace + 1);
}

function sanitizeThemeName(value) {
  const name = String(value || '').trim();

  if (!name) {
    return 'Search Engagement Theme';
  }

  return name;
}


function fetchGeminiResponseWithFallback(apiKey, prompt) {
  const primaryResponse =
    callGeminiModel(
      apiKey,
      'gemini-2.5-flash',
      prompt
    );

  if (primaryResponse.ok) {
    return primaryResponse;
  }

  if (shouldFallbackToGemini20(primaryResponse)) {
    const fallbackResponse =
      callGeminiModel(
        apiKey,
        'gemini-2.0-flash',
        prompt
      );

    if (fallbackResponse.ok) {
      return fallbackResponse;
    }

    return fallbackResponse;
  }

  return primaryResponse;
}

function shouldFallbackToGemini20(response) {
  if (response.statusCode === 503) {
    return true;
  }

  const body =
    String(response.body || '')
      .toLowerCase();

  if (body.indexOf('high demand') >= 0) {
    return true;
  }

  if (body.indexOf('unavailable') >= 0) {
    return true;
  }

  return false;
}

function callGeminiModel(apiKey, modelName, prompt) {
  const response =
    UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' +
        modelName +
        ':generateContent?key=' +
        apiKey,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2
          }
        }),
        muteHttpExceptions: true
      }
    );

  const statusCode =
    response.getResponseCode();

  const body =
    response.getContentText();

  return {
    ok:
      statusCode >= 200 &&
      statusCode < 300,

    statusCode:
      statusCode,

    body:
      body
  };
}


function generateGeminiTopSections(compactSummaryContext) {
  const apiKey =
    PropertiesService
      .getScriptProperties()
      .getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    return (
      '*EXECUTIVE SUMMARY AND STRATEGIC RECOMMENDATIONS BY GEMINI*\n\n' +
      'Gemini summary could not be generated. Review the deterministic report below.\n\n' +
      'Error Message:\n\n' +
      'GEMINI_API_KEY is not configured.'
    );
  }

  const prompt =
    'You are writing for Example Company company leadership. You will receive a compact monthly performance context built from deterministic report metrics. Write one single section only. The section title must be exactly: *EXECUTIVE SUMMARY AND STRATEGIC RECOMMENDATIONS BY GEMINI* Write one single paragraph of 6 to 8 complete sentences. Summarize what happened across demo totals, website traffic totals, website performance, strategic search themes, and top search engagement themes. Then include practical strategic recommendations to improve demos, traffic, engagement, search visibility, and conversion efficiency. Use only the metrics in the supplied context. Do not invent numbers. Do not add claims not supported by the context. Do not use bullets. Do not create multiple sections. Do not mention Gemini except in the required title. Keep the tone executive, analytical, direct, concise, and leadership-oriented. Focus on what changed, what strengthened, what weakened, and what action should follow. Keep the full output under 220 words. Every sentence must be complete. Do not stop mid-sentence. COMPACT CONTEXT: ' +
    compactSummaryContext;

  const response =
    fetchGeminiResponseWithFallback(
      apiKey,
      prompt
    );

  if (!response.ok) {
    return (
      '*EXECUTIVE SUMMARY AND STRATEGIC RECOMMENDATIONS BY GEMINI*\n\n' +
      'Gemini summary could not be generated. Review the deterministic report below.\n\n' +
      'Error Message:\n\n' +
      response.body
    );
  }

  let data;

  try {
    data = JSON.parse(response.body);
  } catch (e) {
    return (
      '*EXECUTIVE SUMMARY AND STRATEGIC RECOMMENDATIONS BY GEMINI*\n\n' +
      'Gemini summary could not be generated. Review the deterministic report below.\n\n' +
      'Error Message:\n\n' +
      response.body
    );
  }

  if (
    !data.candidates ||
    !data.candidates[0] ||
    !data.candidates[0].content ||
    !data.candidates[0].content.parts ||
    !data.candidates[0].content.parts[0] ||
    !data.candidates[0].content.parts[0].text
  ) {
    return (
      '*EXECUTIVE SUMMARY AND STRATEGIC RECOMMENDATIONS BY GEMINI*\n\n' +
      'Gemini summary could not be generated. Review the deterministic report below.\n\n' +
      'Error Message:\n\n' +
      response.body
    );
  }

  let output =
    data.candidates[0]
      .content.parts[0]
      .text
      .trim();

  if (
    output.indexOf(
      '*EXECUTIVE SUMMARY AND STRATEGIC RECOMMENDATIONS BY GEMINI*'
    ) === -1
  ) {
    output =
      '*EXECUTIVE SUMMARY AND STRATEGIC RECOMMENDATIONS BY GEMINI*\n\n' +
      output;
  }

  return output;
}

function buildGeminiSummaryContext(reportMonthLabelUpper, currentDemoMetrics, comparisonDemoMetrics, ytdMetrics, currentTraffic, comparisonTraffic, totalDemos, demoConversionRatio, previousDemoConversionRatio, demoAcquisitionEfficiencyRatio, previousDemoAcquisitionEfficiencyRatio, newToReturningRatio, strategicSearchThemesSection, topSearchEngagementSection) {
  return [
    'Month: ' + reportMonthLabelUpper,
    'Demo totals: Category A ' + currentDemoMetrics.categoryA + formatDemoLineSuffix(currentDemoMetrics.categoryA, comparisonDemoMetrics.categoryA, ytdMetrics.categoryAYTD) + '; Category B ' + currentDemoMetrics.categoryB + formatDemoLineSuffix(currentDemoMetrics.categoryB, comparisonDemoMetrics.categoryB, ytdMetrics.categoryBYTD) + '.',
    'Website traffic: Sessions ' + currentTraffic.sessions + formatMoMPercent(currentTraffic.sessions, comparisonTraffic.sessions) + '; Engaged sessions ' + currentTraffic.engagedSessions + formatMoMPercent(currentTraffic.engagedSessions, comparisonTraffic.engagedSessions) + '; New users ' + currentTraffic.newUsers + formatMoMPercent(currentTraffic.newUsers, comparisonTraffic.newUsers) + '; Returning users ' + currentTraffic.returningUsers + formatMoMPercent(currentTraffic.returningUsers, comparisonTraffic.returningUsers) + '; Search ' + currentTraffic.search + formatMoMPercent(currentTraffic.search, comparisonTraffic.search) + '; Direct ' + currentTraffic.direct + formatMoMPercent(currentTraffic.direct, comparisonTraffic.direct) + '; Referral ' + currentTraffic.referral + formatMoMPercent(currentTraffic.referral, comparisonTraffic.referral) + '; Other ' + currentTraffic.other + formatMoMPercent(currentTraffic.other, comparisonTraffic.other) + '.',
    'Website performance: Demo conversion ratio ' + demoConversionRatio.toFixed(2) + '%' + formatMoMPercentValue(demoConversionRatio, previousDemoConversionRatio) + '; Demo acquisition efficiency ratio ' + demoAcquisitionEfficiencyRatio.toFixed(2) + '%' + formatMoMPercentValue(demoAcquisitionEfficiencyRatio, previousDemoAcquisitionEfficiencyRatio) + '; New-to-returning user ratio ' + newToReturningRatio.toFixed(2) + 'x.',
    'Strategic search themes section: ' + truncateForGeminiContext(strategicSearchThemesSection, 2500),
    'Top search engagement themes section: ' + truncateForGeminiContext(topSearchEngagementSection, 2500)
  ].join('\n');
}

function truncateForGeminiContext(value, maxLength) {
  const text = String(value || '');

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}


function parseMonthLabelToDate(monthLabel) {
  const parsed = new Date(monthLabel + ' 1');

  if (isNaN(parsed)) {
    throw new Error('Could not parse month label: ' + monthLabel);
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return year + '-' + month;
}

function formatDate(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}

function formatDemoLineSuffix(current, previous, ytd) {
  const momText = formatMoMAbsoluteForDemo(current, previous);
  return ' (' + momText + '; ' + ytd + ' total YTD)';
}

function formatMoMAbsoluteForDemo(current, previous) {
  const diff = current - previous;

  if (diff > 0) {
    return 'up ' + diff + ' MoM';
  }

  if (diff < 0) {
    return 'down ' + Math.abs(diff) + ' MoM';
  }

  return 'flat MoM';
}


function formatMoMCountLabel(current, previous) {
  current = Number(current || 0);
  previous = Number(previous || 0);

  if (previous === 0 && current > 0) {
    return '(new)';
  }

  if (previous === 0) {
    return '';
  }

  const pct = ((current - previous) / previous) * 100;

  if (pct > 0) {
    return '(up ' + pct.toFixed(1) + '% MoM)';
  }

  if (pct < 0) {
    return '(down ' + Math.abs(pct).toFixed(1) + '% MoM)';
  }

  return '(flat 0.0% MoM)';
}


function formatMoMPercent(current, previous) {
  if (previous === 0) {
    return '';
  }

  const pct = ((current - previous) / previous) * 100;

  if (pct > 0) {
    return ' (up ' + pct.toFixed(1) + '% MoM)';
  }

  if (pct < 0) {
    return ' (down ' + Math.abs(pct).toFixed(1) + '% MoM)';
  }

  return ' (flat 0.0% MoM)';
}

function formatMoMPercentValue(currentValue, previousValue) {
  if (previousValue === null || previousValue === 0) {
    return '';
  }

  const pct = ((currentValue - previousValue) / previousValue) * 100;

  if (pct > 0) {
    return ' (up ' + pct.toFixed(1) + '% MoM)';
  }

  if (pct < 0) {
    return ' (down ' + Math.abs(pct).toFixed(1) + '% MoM)';
  }

  return ' (flat 0.0% MoM)';
}

function getNewToReturningContext(ratio) {
  if (ratio > 1) {
    return '>1.0x is an acquisition-heavy month';
  }

  if (ratio < 1) {
    return '<1.0x is a retention-heavy month';
  }

  return '~1.0x is a balanced acquisition/retention month';
}

function toTitleCase(value) {
  const smallWords = ['and', 'or', 'the', 'in', 'of', 'for', 'to', 'vs'];

  return String(value || '')
    .split(' ')
    .map(function (word, index) {
      const lower = word.toLowerCase();

      if (lower === 'ai') return 'AI';
      if (lower === 'industry') return 'Industry';
      if (lower === 'llm') return 'LLM';
      if (lower === 'aeo') return 'AEO';
      if (lower === 'business report') return 'Business Report';

      if (index > 0 && smallWords.indexOf(lower) >= 0) {
        return lower;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
