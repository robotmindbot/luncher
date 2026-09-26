package expo.modules.applauncher

import android.content.Intent
import android.content.ContentUris
import android.os.Build
import android.Manifest
import android.content.pm.PackageManager
import android.provider.CalendarContract.Instances
import android.provider.CalendarContract.Events
import android.view.WindowInsets
import android.view.WindowInsetsAnimationControlListener
import android.view.WindowInsetsAnimationController
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

    AsyncFunction("getNextCalendarAppointment") {
      val context = appContext.reactContext ?: return@AsyncFunction null
      if (context.checkSelfPermission(Manifest.permission.READ_CALENDAR) != PackageManager.PERMISSION_GRANTED) {
        return@AsyncFunction null
      }
      val now = System.currentTimeMillis()
      val start = java.util.Calendar.getInstance().apply {
        set(java.util.Calendar.HOUR_OF_DAY, 0)
        set(java.util.Calendar.MINUTE, 0)
        set(java.util.Calendar.SECOND, 0)
        set(java.util.Calendar.MILLISECOND, 0)
      }.timeInMillis
      val end = java.util.Calendar.getInstance().apply {
        add(java.util.Calendar.DAY_OF_YEAR, 1)
        set(java.util.Calendar.HOUR_OF_DAY, 0)
        set(java.util.Calendar.MINUTE, 0)
        set(java.util.Calendar.SECOND, 0)
        set(java.util.Calendar.MILLISECOND, 0)
      }.timeInMillis
      val uri = Instances.CONTENT_URI.buildUpon()
        .appendPath(start.toString())
        .appendPath(end.toString())
        .build()
      val projection = arrayOf(Instances.EVENT_ID, Instances.TITLE, Instances.BEGIN, Instances.END, Instances.ALL_DAY)
      var allDayEvent: Map<String, Any>? = null
      context.contentResolver.query(uri, projection, null, null, "${Instances.BEGIN} ASC")?.use { cursor ->
        while (cursor.moveToNext()) {
          val eventId = cursor.getLong(0)
          val title = cursor.getString(1)?.takeIf { it.isNotBlank() } ?: continue
          val begin = cursor.getLong(2)
          val end = cursor.getLong(3)
          val allDay = cursor.getInt(4) != 0
          val event = mapOf("eventId" to eventId, "title" to title, "begin" to begin, "end" to end, "allDay" to allDay)
          if (allDay) {
            if (allDayEvent == null) allDayEvent = event
          } else if (begin >= now) {
            return@AsyncFunction event
          }
        }
      }
      allDayEvent
    }

    Function("openCalendarEvent") { eventId: Long, begin: Long, end: Long ->
      val context = appContext.reactContext ?: return@Function false
      val intent = Intent(Intent.ACTION_VIEW, ContentUris.withAppendedId(Events.CONTENT_URI, eventId))
        .putExtra(android.provider.CalendarContract.EXTRA_EVENT_BEGIN_TIME, begin)
        .putExtra(android.provider.CalendarContract.EXTRA_EVENT_END_TIME, end)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      if (intent.resolveActivity(context.packageManager) == null) return@Function false
      context.startActivity(intent)
      true
    }

    Function("finishKeyboardShowImmediately") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return@Function false
      val activity = appContext.currentActivity ?: return@Function false
      activity.runOnUiThread {
        activity.window.insetsController?.controlWindowInsetsAnimation(
          WindowInsets.Type.ime(), 0L, null, null,
          object : WindowInsetsAnimationControlListener {
            override fun onReady(controller: WindowInsetsAnimationController, types: Int) {
              controller.setInsetsAndAlpha(controller.shownStateInsets, 1f, 1f)
              controller.finish(true)
            }

            override fun onFinished(controller: WindowInsetsAnimationController) = Unit
            override fun onCancelled(controller: WindowInsetsAnimationController?) = Unit
          }
        )
      }
      true
    }
  }
}
