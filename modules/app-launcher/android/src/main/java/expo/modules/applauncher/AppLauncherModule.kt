package expo.modules.applauncher

import android.content.Intent
import android.content.pm.PackageManager
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

      packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
        .mapNotNull { application ->
          if (packageManager.getLaunchIntentForPackage(application.packageName) == null) return@mapNotNull null
          mapOf(
            "name" to packageManager.getApplicationLabel(application).toString(),
            "packageName" to application.packageName,
          )
        }
    }

    AsyncFunction("launchApp") { packageName: String ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      val intent = context.packageManager.getLaunchIntentForPackage(packageName)
        ?: return@AsyncFunction false
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }
  }
}
