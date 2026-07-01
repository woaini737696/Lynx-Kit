// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'package:flutter_core/theme/app_colors.dart';

/// 扫码部署页：用 mobile_scanner 实时扫描，识别二维码后跳转部署确认页
class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _detected = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.go('/home'),
        ),
        title: const Text('扫码部署'),
        actions: [
          // 切换闪光灯
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _controller.toggleTorch(),
          ),
          // 切换前后摄像头
          IconButton(
            icon: const Icon(Icons.cameraswitch),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // 扫描预览
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          // 扫描框遮罩
          ColorFiltered(
            colorFilter: ColorFilter.mode(
              Colors.black.withOpacity(0.4),
              BlendMode.srcOut,
            ),
            child: Stack(
              children: [
                Center(
                  child: Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // 扫描框边框
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary, width: 2),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          // 底部提示
          Positioned(
            bottom: 48,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  '将部署二维码对准框内',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _onDetect(BarcodeCapture capture) {
    if (_detected) return;
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final value = barcodes.first.rawValue;
    if (value == null || value.isEmpty) return;

    setState(() => _detected = true);

    // 解析二维码内容（预期格式：projectId 或 lynxkit://deploy/{projectId}）
    final projectId = _parseProjectId(value);
    if (projectId != null) {
      // 跳转部署确认页
      context.go('/projects/$projectId');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('无法识别的二维码：$value')),
      );
      setState(() => _detected = false);
    }
  }

  String? _parseProjectId(String raw) {
    // 支持 lynxkit://deploy/{projectId} 或纯 projectId
    if (raw.startsWith('lynxkit://deploy/')) {
      return raw.substring('lynxkit://deploy/'.length);
    }
    if (raw.length > 10 && !raw.contains(' ')) {
      return raw;
    }
    return null;
  }
}
