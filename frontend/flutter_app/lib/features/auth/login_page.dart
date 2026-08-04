import 'dart:async';

import 'package:flutter/material.dart';

import '../../app/app_routes.dart';
import '../../core/storage/auth_storage.dart';
import '../../shared/widgets/auth_page_shell.dart';
import 'auth_api.dart';

typedef LoginUser = Future<dynamic> Function({
  required String email,
  required String password,
});

class LoginPage extends StatefulWidget {
  const LoginPage({
    super.key,
    this.loginUser = _loginWithApi,
  });

  final LoginUser loginUser;

  static Future<void> _loginWithApi({
    required String email,
    required String password,
  }) {
    return AuthApi().login(email: email, password: password);
  }

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _hidePassword = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    // Fire-and-forget: if a session is already stored, this hops straight
    // to the home screen; otherwise the login form (already rendered
    // above) just stays as-is. Wrapped in try/catch since secure storage
    // isn't backed by a real platform channel in the widget-test
    // environment — that must never crash the login screen itself.
    unawaited(_restoreSessionIfPresent());
  }

  Future<void> _restoreSessionIfPresent() async {
    try {
      final loggedIn = await AuthStorage.isLoggedIn();
      if (!loggedIn || !mounted) {
        return;
      }
      final userId = await AuthStorage.getUserId();
      final email = await AuthStorage.getEmail();
      if (!mounted) {
        return;
      }
      Navigator.pushNamedAndRemoveUntil(
        context,
        AppRoutes.home,
        (route) => false,
        arguments: {'id': userId ?? '', 'email': email ?? ''},
      );
    } catch (_) {
      // Secure storage unavailable (e.g. in tests) — fall back to showing
      // the login form, exactly like a fresh, never-logged-in install.
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageShell(
      title: 'Welcome back',
      subtitle: 'Login to book movies and manage your tickets.',
      children: [
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Email ID',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Enter your email ID';
                  }
                  if (!value.contains('@')) {
                    return 'Enter a valid email ID';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                obscureText: _hidePassword,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    tooltip: _hidePassword ? 'Show password' : 'Hide password',
                    icon: Icon(
                      _hidePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                    onPressed: () {
                      setState(() => _hidePassword = !_hidePassword);
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Enter your password';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                icon: const Icon(Icons.login),
                label: Text(_isSubmitting ? 'Logging in...' : 'Login'),
                onPressed: _isSubmitting ? null : _submitLogin,
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                icon: const Icon(Icons.person_add_alt_1_outlined),
                label: const Text('Create new account'),
                onPressed: () {
                  Navigator.pushNamed(context, AppRoutes.register);
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _submitLogin() async {
    if (_formKey.currentState?.validate() != true) {
      return;
    }

    final email = _emailController.text.trim();

    setState(() => _isSubmitting = true);

    try {
      final result = await widget.loginUser(
        email: email,
        password: _passwordController.text,
      );
      final user = result is Map<String, dynamic>
          ? result['user'] as Map<String, dynamic>?
          : null;
      final token = result is Map<String, dynamic> ? result['token'] as String? : null;

      // The JWT lives only in secure storage from here on — it is
      // deliberately NOT part of the route arguments below, so it never
      // ends up threaded through any widget constructor.
      if (token != null && token.isNotEmpty) {
        await AuthStorage.saveToken(token);
        final userId = user?['id'] as String?;
        if (userId != null && userId.isNotEmpty) {
          await AuthStorage.saveUserId(userId);
        }
        await AuthStorage.saveEmail(email);
      }

      if (!mounted) {
        return;
      }

      Navigator.pushNamedAndRemoveUntil(
        context,
        AppRoutes.home,
        (route) => false,
        arguments: user ?? {'email': email},
      );
    } on AuthApiException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to login right now')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}
