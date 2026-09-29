const { withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

const withAndroidLauncher = (config) => {
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    // Ensure we have an application node
    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];

    // Ensure we have activities array
    if (!application.activity) {
      application.activity = [];
    }

    // Find the main activity (should be MainActivity)
    let mainActivity = application.activity.find(activity =>
      activity.$?.['android:name'] === '.MainActivity'
    );

    // If no main activity found, find the first activity with intent filters
    if (!mainActivity) {
      mainActivity = application.activity.find(activity =>
        activity['intent-filter'] && Array.isArray(activity['intent-filter'])
      );
    }

    // If still no main activity, create one
    if (!mainActivity) {
      mainActivity = {
        $: {
          'android:name': '.MainActivity',
          'android:exported': 'true',
          'android:launchMode': 'singleTask',
          'android:clearTaskOnLaunch': 'true',
          'android:stateNotNeeded': 'true',
          'android:theme': '@style/Theme.App.SplashScreen'
        },
        'intent-filter': []
      };
      application.activity.push(mainActivity);
    }

    // Ensure intent-filter is an array
    if (!mainActivity['intent-filter']) {
      mainActivity['intent-filter'] = [];
    }

    // Configure activity attributes for launcher behavior
    if (!mainActivity.$) {
      mainActivity.$ = {};
    }

    mainActivity.$['android:launchMode'] = 'singleTask';
    mainActivity.$['android:clearTaskOnLaunch'] = 'true';
    mainActivity.$['android:stateNotNeeded'] = 'true';
    mainActivity.$['android:excludeFromRecents'] = 'true';
    mainActivity.$['android:exported'] = 'true';

    // Check if HOME launcher intent filter exists (different from regular LAUNCHER)
    const hasHomeIntent = mainActivity['intent-filter'].some(filter => {
      if (!filter.category) return false;
      const categories = Array.isArray(filter.category) ? filter.category : [filter.category];
      return categories.some(cat =>
        cat.$?.['android:name'] === 'android.intent.category.HOME'
      );
    });

    if (!hasHomeIntent) {
      // Add the HOME launcher intent filter (essential for launcher apps)
      mainActivity['intent-filter'].push({
        action: [{
          $: { 'android:name': 'android.intent.action.MAIN' }
        }],
        category: [
          { $: { 'android:name': 'android.intent.category.HOME' } },
          { $: { 'android:name': 'android.intent.category.DEFAULT' } }
        ]
      });
    }

    // Ensure permissions are set
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const requiredPermissions = ['android.permission.QUERY_ALL_PACKAGES'];

    requiredPermissions.forEach(permission => {
      const exists = manifest['uses-permission'].some(perm =>
        perm.$?.['android:name'] === permission
      );

      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });

    // Add queries for Android 11+ compatibility
    if (!manifest.queries) {
      manifest.queries = [];
    }

    const hasLauncherQuery = manifest.queries.some(query => {
      if (!query.intent) return false;
      const intents = Array.isArray(query.intent) ? query.intent : [query.intent];
      return intents.some(intent => {
        if (!intent.action || !intent.category) return false;
        const actions = Array.isArray(intent.action) ? intent.action : [intent.action];
        const categories = Array.isArray(intent.category) ? intent.category : [intent.category];

        return actions.some(action => action.$?.['android:name'] === 'android.intent.action.MAIN') &&
               categories.some(category => category.$?.['android:name'] === 'android.intent.category.LAUNCHER');
      });
    });

    if (!hasLauncherQuery) {
      manifest.queries.push({
        intent: [{
          action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
          category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }]
        }]
      });
    }

    return config;
  });

  return withMainActivity(config, (config) => {
    const { contents } = config.modResults;
    const marker = 'override fun onWindowFocusChanged(hasFocus: Boolean)';
    const handler = `override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
      window.decorView.postDelayed({
        window.navigationBarColor = android.graphics.Color.TRANSPARENT
        window.isNavigationBarContrastEnforced = false
        window.decorView.systemUiVisibility = window.decorView.systemUiVisibility and
          android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv()
      }, 500)
    }
  }

  `;
    if (!contents.includes(marker)) {
      config.modResults.contents = contents.replace('  override fun getMainComponentName()', `  ${handler}override fun getMainComponentName()`);
    }
    return config;
  });
};

module.exports = withAndroidLauncher;
