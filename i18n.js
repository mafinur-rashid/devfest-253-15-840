// Translations for Smart Escape (English and Bangla)
const translations = {
  en: {
    appTitle: "Smart Escape",
    appSubtitle: "Interactive Evacuation Route Simulator",
    badgeMock: "AI DevFest 2026",
    navUpload: "Upload JSON",
    navReset: "Reset Hazards",
    navTests: "Verify Test Cases",
    navExport: "Export PNG",
    navHighContrast: "High Contrast",
    navWalkthrough: "Start Walkthrough",
    navWalkthroughStop: "Stop Walkthrough",
    navWalkthroughStep: "Next Step",
    mapLegend: "Legend",
    legendRoom: "Room",
    legendJunction: "Junction",
    legendExit: "Exit",
    legendBlocked: "Blocked / Closed",
    legendActiveRoute: "Evacuation Route",
    legendStart: "Start Node",
    routeCardTitle: "Evacuation Plan",
    statusHeading: "Route Status",
    noRouteAvailable: "No route available",
    startingLocationBlocked: "Starting location blocked",
    routeFound: "Optimal evacuation route active",
    selectStartPrompt: "Select an unblocked room or junction to begin simulation",
    startLocation: "Start Location",
    targetExit: "Target Exit",
    totalCost: "Total Path Cost",
    routeSequence: "Route Sequence",
    altRoutesTitle: "Alternative Routes",
    noAltRoutes: "No alternative routes available",
    hazardPanelTitle: "Hazard Controls & Quick Toggles",
    nodesList: "Nodes (Rooms & Junctions)",
    edgesList: "Corridors (Edges)",
    exitsList: "Exits",
    clickToToggle: "Click any map element or use the switches below to simulate hazards.",
    costLabel: "Cost",
    stateOpen: "Open",
    stateBlocked: "Blocked",
    stateClosed: "Closed",
    stateClear: "Clear",
    btnBlock: "Block",
    btnUnblock: "Unblock",
    btnClose: "Close",
    btnReopen: "Reopen",
    testSuiteTitle: "Official Contest Test Cases (Section 4.1)",
    runAllTests: "Run Automated Test Suite",
    testPassed: "PASSED",
    testFailed: "FAILED",
    testScenario1: "1. Baseline (Start: R1)",
    testScenario2: "2. Blocked Junction (Start: R1, Block: C2)",
    testScenario3: "3. Exits Closed (Start: R1, Close: E1 & E2)",
    testScenario4: "4. Different Start (Start: R2)",
    testScenario5: "5. Blocked Start (Start: R1, Block: R1)",
    jsonUploadTitle: "Upload Custom Building JSON",
    jsonDropzone: "Drop building.json here or click to browse",
    jsonLoadDefault: "Load Sample Building Data",
    jsonInvalid: "Invalid building JSON: ",
    walkthroughStep: "Step",
    walkthroughArrived: "Evacuation completed safely at",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    zoomReset: "Fit to Screen",
    helpTip: "Tip: Drag the map to pan, scroll to zoom. Click any node to set start or toggle hazard."
  },
  bn: {
    appTitle: "স্মার্ট এস্কেপ",
    appSubtitle: "ইন্টারেক্টিভ জরুরী উদ্ধার পথ সিমুলেটর",
    badgeMock: "এআই ডেভফেস্ট ২০২৬",
    navUpload: "জেসন আপলোড",
    navReset: "পূর্বাবস্থায় রিসেট",
    navTests: "টেস্ট কেস যাচাই",
    navExport: "পিএনজি সংরক্ষণ",
    navHighContrast: "উচ্চ বৈসাদৃশ্য",
    navWalkthrough: "অ্যানিমেশন শুরু",
    navWalkthroughStop: "অ্যানিমেশন থামান",
    navWalkthroughStep: "পরবর্তী ধাপ",
    mapLegend: "চিহ্ন নির্দেশিকা",
    legendRoom: "রুম (কক্ষ)",
    legendJunction: "জাংশন (সংযোগস্থল)",
    legendExit: "প্রস্থান (নির্গমন পথ)",
    legendBlocked: "অবরুদ্ধ / বন্ধ",
    legendActiveRoute: "উদ্ধার পথ",
    legendStart: "শুরুর স্থান",
    routeCardTitle: "উদ্ধার পরিকল্পনা",
    statusHeading: "পথের অবস্থা",
    noRouteAvailable: "No route available", // Problem spec requires exact English / localized support
    startingLocationBlocked: "Starting location blocked",
    routeFound: "সর্বনিম্ন ব্যয়ের উদ্ধার পথ সক্রিয়",
    selectStartPrompt: "সিমুলেশন শুরু করতে একটি মুক্ত রুম বা জাংশন নির্বাচন করুন",
    startLocation: "শুরুর অবস্থান",
    targetExit: "গন্তব্য প্রস্থান",
    totalCost: "মোট ব্যয় (Cost)",
    routeSequence: "পথের ক্রম",
    altRoutesTitle: "বিকল্প পথসমূহ",
    noAltRoutes: "কোনো বিকল্প পথ পাওয়া যায়নি",
    hazardPanelTitle: "ঝুঁকি ও বাধা নিয়ন্ত্রণ",
    nodesList: "নোডসমূহ (রুম ও জাংশন)",
    edgesList: "করিডোর (সংযোগ পথ)",
    exitsList: "প্রস্থান দ্বারসমূহ",
    clickToToggle: "মানচিত্রের উপাদানে ক্লিক করুন বা নিচের বোতাম ব্যবহার করে বাধা তৈরি করুন।",
    costLabel: "ব্যয়",
    stateOpen: "খোলা",
    stateBlocked: "অবরুদ্ধ",
    stateClosed: "বন্ধ",
    stateClear: "মুক্ত",
    btnBlock: "অবরুদ্ধ করুন",
    btnUnblock: "মুক্ত করুন",
    btnClose: "বন্ধ করুন",
    btnReopen: "খুলুন",
    testSuiteTitle: "অফিসিয়াল টেস্ট কেস (ধারা ৪.১)",
    runAllTests: "স্বয়ংক্রিয় টেস্ট কেস চালান",
    testPassed: "উত্তীর্ণ (PASSED)",
    testFailed: "ব্যর্থ (FAILED)",
    testScenario1: "১. বেসলাইন (শুরু: R1)",
    testScenario2: "২. অবরুদ্ধ জাংশন (শুরু: R1, বাধা: C2)",
    testScenario3: "৩. সকল প্রস্থান বন্ধ (শুরু: R1, বন্ধ: E1 ও E2)",
    testScenario4: "৪. ভিন্ন শুরু (শুরু: R2)",
    testScenario5: "৫. শুরুর স্থান অবরুদ্ধ (শুরু: R1, বাধা: R1)",
    jsonUploadTitle: "কাস্টম বিল্ডিং জেসন (JSON) আপলোড করুন",
    jsonDropzone: "building.json ড্রপ করুন অথবা নির্বাচন করতে ক্লিক করুন",
    jsonLoadDefault: "নমুনা বিল্ডিং লোড করুন",
    jsonInvalid: "ত্রুটিপূর্ণ জেসন ফাইল: ",
    walkthroughStep: "ধাপ",
    walkthroughArrived: "নিরাপদে পৌঁছানো সম্পন্ন হয়েছে:",
    zoomIn: "বড় করুন",
    zoomOut: "ছোট করুন",
    zoomReset: "স্ক্রিনে ফিট করুন",
    helpTip: "পরামর্শ: মানচিত্রটি ড্র্যাগ করে সরানো যায় এবং স্ক্রল করে জুম করা যায়।"
  }
};

let currentLang = "en";

function setLanguage(lang) {
  if (lang !== "en" && lang !== "bn") return;
  currentLang = lang;
  document.documentElement.lang = lang;
  updateUIText();
}

function t(key) {
  return translations[currentLang][key] || translations["en"][key] || key;
}

function updateUIText() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[currentLang][key]) {
      el.setAttribute("placeholder", translations[currentLang][key]);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (translations[currentLang][key]) {
      el.setAttribute("title", translations[currentLang][key]);
    }
  });

  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    langBtn.textContent = currentLang === "en" ? "বাংলা" : "English";
  }

  // Refresh active route panel text if router exists
  if (window.app && typeof window.app.refreshUI === "function") {
    window.app.refreshUI();
  }
}
