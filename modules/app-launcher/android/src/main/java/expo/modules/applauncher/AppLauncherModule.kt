package expo.modules.applauncher

import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppLauncherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppLauncher")
    Events("onHomeIntent")

    OnNewIntent { intent ->
      if (intent.action == Intent.ACTION_MAIN && intent.hasCategory(Intent.CATEGORY_HOME)) {
        sendEvent("onHomeIntent")
      }
    }

    AsyncFunction("getInstalledApps") {
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, String>>()
      val packageManager = context.packageManager
      val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)

      packageManager.queryIntentActivities(launcherIntent, 0)
        .map { activity ->
          mapOf(
            "name" to activity.loadLabel(packageManager).toString(),
            "packageName" to activity.activityInfo.packageName,
          )
        }
    }

    Function("launchApp") { packageName: String ->
      val context = appContext.reactContext ?: return@Function false
      val intent = context.packageManager.getLaunchIntentForPackage(packageName)
        ?: return@Function false
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }
  }
}
