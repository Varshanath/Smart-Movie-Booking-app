import 'package:flutter/material.dart';

import '../../app/app_routes.dart';
import '../../shared/widgets/auth_page_shell.dart';
import 'auth_api.dart';

typedef ChangePassword = Future<void> Function({
  required String email,
  required String currentPassword,
  required String newPassword,
});

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({
    required this.email,
    this.userId = '',
    super.key,
    this.changePassword = _changePasswordWithApi,
  });

  final String email;
  final String userId;
  final ChangePassword changePassword;

  static Future<void> _changePasswordWithApi({
    required String email,
    required String currentPassword,
    required String newPassword,
  }) {
    return AuthApi().changePassword(
      email: email,
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
  }

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  bool _hideCurrentPassword = true;
  bool _hideNewPassword = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageShell(
      title: 'Change password',
      subtitle: 'Update the password for ${widget.email}.',
      children: [
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _currentPasswordController,
                obscureText: _hideCurrentPassword,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: 'Current password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    tooltip: _hideCurrentPassword
                        ? 'Show password'
                        : 'Hide password',
                    icon: Icon(
                      _hideCurrentPassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                    onPressed: () {
                      setState(() {
                        _hideCurrentPassword = !_hideCurrentPassword;
                      });
                    },
                  ),
                ),
                validator: _required('Enter your current password'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _newPasswordController,
                obscureText: _hideNewPassword,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: 'New password',
                  prefixIcon: const Icon(Icons.password_outlined),
                  suffixIcon: IconButton(
                    tooltip:
                        _hideNewPassword ? 'Show password' : 'Hide password',
                    icon: Icon(
                      _hideNewPassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                    onPressed: () {
                      setState(() => _hideNewPassword = !_hideNewPassword);
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.length < 6) {
                    return 'New password must be at least 6 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                icon: const Icon(Icons.save_outlined),
                label: Text(_isSubmitting ? 'Saving...' : 'Save password'),
                onPressed: _isSubmitting ? null : _submitChange,
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                icon: const Icon(Icons.arrow_back),
                label: const Text('Back'),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String? Function(String?) _required(String message) {
    return (value) {
      if (value == null || value.isEmpty) {
        return message;
      }
      return null;
    };
  }

  Future<void> _submitChange() async {
    if (_formKey.currentState?.validate() != true) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await widget.changePassword(
        email: widget.email,
        currentPassword: _currentPasswordController.text,
        newPassword: _newPasswordController.text,
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password changed successfully')),
      );
      Navigator.pushNamedAndRemoveUntil(
        context,
        AppRoutes.home,
        (route) => false,
        arguments: {'id': widget.userId, 'email': widget.email},
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
        const SnackBar(content: Text('Unable to change password right now')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}
