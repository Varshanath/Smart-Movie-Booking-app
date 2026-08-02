import 'package:flutter/material.dart';

/// A back button for AppBars that also have a [Scaffold.drawer] set —
/// Flutter's default leading-icon resolution shows the drawer's hamburger
/// instead of a back button in that case, even when the route can be popped.
Widget? backButtonLeading(BuildContext context) {
  return Navigator.canPop(context) ? const BackButton() : null;
}

/// Opens the [Scaffold.drawer] from an AppBar action, for use alongside
/// [backButtonLeading] once the default hamburger leading icon is replaced.
Widget drawerMenuAction() {
  return Builder(
    builder: (context) => IconButton(
      icon: const Icon(Icons.menu),
      tooltip: 'Open menu',
      onPressed: () => Scaffold.of(context).openDrawer(),
    ),
  );
}
