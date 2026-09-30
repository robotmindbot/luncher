# Android permissions

Luncher requests the permissions used by its launcher and optional calendar feature.

## Installed app discovery

`QUERY_ALL_PACKAGES` lets Luncher find launchable apps so it can display and search them. This is required for the app's core launcher function.

## Network access

Expo's file-system module adds the normal `INTERNET` permission to the Android manifest. Luncher does not make network requests or include analytics, ads, or crash reporting.

## Calendar access

`READ_CALENDAR` is optional. Luncher asks for it when the user enables the next calendar appointment setting. Denying it leaves the launcher and app search usable; the appointment line stays empty.
