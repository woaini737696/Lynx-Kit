// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';

import 'package:flutter_core/theme/app_colors.dart';

/// 加载指示器 widget
class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({
    super.key,
    this.message,
    this.size = 32,
    this.centered = true,
  });

  final String? message;
  final double size;
  final bool centered;

  @override
  Widget build(BuildContext context) {
    final widget = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: size,
          height: size,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: AppColors.primary,
          ),
        ),
        if (message != null) ...[
          const SizedBox(height: 16),
          Text(
            message!,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );

    if (centered) {
      return Center(child: widget);
    }
    return widget;
  }
}
