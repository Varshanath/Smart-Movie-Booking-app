import 'package:flutter/material.dart';

import '../../shared/theme/app_theme.dart';
import '../../shared/widgets/app_bar_actions.dart';
import '../../shared/widgets/app_drawer.dart';
import '../movies/models.dart';
import '../movies/movie_booking_api.dart';

/// One turn in the chat log. The backend's AiChatMessage is a single
/// prompt+response pair (see models.dart) — this splits each pair into two
/// bubbles (user, then assistant) for display, since that's the natural
/// chat reading order and no field is invented to do it.
class _ChatBubble {
  _ChatBubble.user(this.text)
      : isUser = true,
        isError = false;

  _ChatBubble.assistant(this.text, {this.isError = false}) : isUser = false;

  final String text;
  final bool isUser;
  final bool isError;
}

class AiChatPage extends StatefulWidget {
  const AiChatPage({
    required this.userId,
    required this.api,
    this.email = '',
    this.profileLocation = '',
    this.moviePreference = const [],
    super.key,
  });

  final String userId;
  final MovieBookingApi api;
  final String email;
  final String profileLocation;
  final List<String> moviePreference;

  @override
  State<AiChatPage> createState() => _AiChatPageState();
}

class _AiChatPageState extends State<AiChatPage> {
  final _promptController = TextEditingController();
  final _scrollController = ScrollController();
  final _bubbles = <_ChatBubble>[];

  var _loadingHistory = true;
  var _sending = false;
  String? _historyError;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  @override
  void dispose() {
    _promptController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _loadingHistory = true;
      _historyError = null;
    });

    try {
      final history = await widget.api.getAiChatHistory();
      final sorted = [...history]..sort((a, b) => a.createdAt.compareTo(b.createdAt));
      if (!mounted) return;
      setState(() {
        _bubbles
          ..clear()
          ..addAll(sorted.expand(_bubblesForMessage));
      });
      _scrollToBottom();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _historyError = _friendlyMessage(error);
      });
    } finally {
      if (mounted) {
        setState(() => _loadingHistory = false);
      }
    }
  }

  Iterable<_ChatBubble> _bubblesForMessage(AiChatMessage message) sync* {
    yield _ChatBubble.user(message.prompt);
    yield _ChatBubble.assistant(message.response);
  }

  Future<void> _send() async {
    final prompt = _promptController.text.trim();
    if (prompt.isEmpty || _sending) {
      return;
    }

    _promptController.clear();
    setState(() {
      _bubbles.add(_ChatBubble.user(prompt));
      _sending = true;
    });
    _scrollToBottom();

    try {
      final message = await widget.api.sendAiChatMessage(prompt);
      if (!mounted) return;
      setState(() {
        _bubbles.add(_ChatBubble.assistant(message.response));
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _bubbles.add(_ChatBubble.assistant(_friendlyMessage(error), isError: true));
      });
    } finally {
      if (mounted) {
        setState(() => _sending = false);
      }
      _scrollToBottom();
    }
  }

  // MovieBookingApi already reduces every failure to a short, user-safe
  // message (see movie_booking_api.dart's _readErrorMessage) — this only
  // adds a fallback for errors that aren't even an HTTP response (timeouts,
  // no connection, agent service down), never exposing anything internal.
  String _friendlyMessage(Object error) {
    if (error is MovieBookingApiException) {
      return error.message;
    }
    return "Something went wrong. Please try again.";
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Assistant'),
        automaticallyImplyLeading: false,
        leading: backButtonLeading(context),
        actions: [drawerMenuAction()],
      ),
      drawer: AppDrawer(
        userId: widget.userId,
        email: widget.email,
        profileLocation: widget.profileLocation,
        moviePreference: widget.moviePreference,
        api: widget.api,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(child: _body()),
            if (_sending) _typingIndicator(),
            _inputBar(),
          ],
        ),
      ),
    );
  }

  Widget _body() {
    if (_loadingHistory) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_historyError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: Theme.of(context).colorScheme.error),
              const SizedBox(height: 12),
              Text(_historyError!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                icon: const Icon(Icons.refresh),
                label: const Text('Try again'),
                onPressed: _loadHistory,
              ),
            ],
          ),
        ),
      );
    }

    if (_bubbles.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.smart_toy_outlined, size: 48, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 12),
              const Text(
                'Ask me things like:',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              const Text(
                '"Recommend some movies for me"\n'
                '"What movies are available in Kolkata?"\n'
                '"Where can I watch Midnight Warrior?"',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.mutedText),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _bubbles.length,
      itemBuilder: (context, index) => _bubbleWidget(_bubbles[index]),
    );
  }

  Widget _bubbleWidget(_ChatBubble bubble) {
    final alignment = bubble.isUser ? Alignment.centerRight : Alignment.centerLeft;
    final Color background;
    final Color textColor;
    if (bubble.isUser) {
      background = AppTheme.primary;
      textColor = Colors.white;
    } else if (bubble.isError) {
      background = const Color(0xFF2A1414);
      textColor = const Color(0xFFEF4444);
    } else {
      background = AppTheme.surface;
      textColor = Colors.white;
    }

    return Align(
      alignment: alignment,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(14),
          border: bubble.isUser ? null : Border.all(color: AppTheme.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (bubble.isError) ...[
              const Icon(Icons.error_outline, size: 16, color: Color(0xFFEF4444)),
              const SizedBox(width: 6),
            ],
            Flexible(child: Text(bubble.text, style: TextStyle(color: textColor))),
          ],
        ),
      ),
    );
  }

  Widget _typingIndicator() {
    return const Padding(
      padding: EdgeInsets.only(left: 16, bottom: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: SizedBox(
          height: 16,
          width: 16,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }

  Widget _inputBar() {
    final canSend = !_sending;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _promptController,
              enabled: canSend,
              textInputAction: TextInputAction.send,
              minLines: 1,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Ask about movies, showtimes, recommendations...',
              ),
              onSubmitted: (_) => _send(),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            onPressed: canSend ? _send : null,
            icon: const Icon(Icons.send),
            tooltip: 'Send',
          ),
        ],
      ),
    );
  }
}
