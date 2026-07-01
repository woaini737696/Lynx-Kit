// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/models/server.dart';
import 'package:flutter_core/state/providers.dart';

/// 添加服务器表单
///
/// - name, ip, port (默认 22), username, password
/// - "测试连接" 按钮（调用 serverService.testConnection）
/// - 测试成功后显示系统信息（OS/CPU/内存/磁盘/Docker 状态）
/// - "保存" 按钮
class AddServerScreen extends ConsumerStatefulWidget {
  const AddServerScreen({super.key});

  @override
  ConsumerState<AddServerScreen> createState() => _AddServerScreenState();
}

class _AddServerScreenState extends ConsumerState<AddServerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _ipCtrl = TextEditingController();
  final _portCtrl = TextEditingController(text: '22');
  final _userCtrl = TextEditingController();
  final _pwdCtrl = TextEditingController();
  bool _obscure = true;
  bool _testing = false;
  bool _saving = false;
  TestConnectionResponse? _testResult;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _ipCtrl.dispose();
    _portCtrl.dispose();
    _userCtrl.dispose();
    _pwdCtrl.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _testing = true;
      _testResult = null;
    });
    try {
      final result = await ref.read(serverServiceProvider).testConnection(
            TestConnectionInput(
              ip: _ipCtrl.text.trim(),
              port: int.tryParse(_portCtrl.text) ?? 22,
              username: _userCtrl.text.trim(),
              password: _pwdCtrl.text,
            ),
          );
      setState(() => _testResult = result);
      if (result.success) {
        _toast('连接成功');
      } else {
        _toast('连接失败：${result.message}');
      }
    } catch (e) {
      _toast('测试失败：$e');
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref.read(serverListNotifierProvider.notifier).create(
            CreateServerInput(
              name: _nameCtrl.text.trim(),
              ip: _ipCtrl.text.trim(),
              port: int.tryParse(_portCtrl.text) ?? 22,
              username: _userCtrl.text.trim(),
              password: _pwdCtrl.text,
            ),
          );
      if (mounted) {
        _toast('服务器已保存');
        context.go('/servers');
      }
    } catch (e) {
      _toast('保存失败：$e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/servers'),
        ),
        title: const Text('添加服务器'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _nameCtrl,
                    decoration: const InputDecoration(
                      labelText: '名称',
                      hintText: '例如：生产服务器',
                      prefixIcon: Icon(Icons.label),
                    ),
                    validator: (v) => v == null || v.isEmpty ? '请输入名称' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          controller: _ipCtrl,
                          decoration: const InputDecoration(
                            labelText: 'IP 地址',
                            prefixIcon: Icon(Icons.computer),
                          ),
                          validator: (v) =>
                              v == null || v.isEmpty ? '请输入 IP' : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 1,
                        child: TextFormField(
                          controller: _portCtrl,
                          decoration: const InputDecoration(
                            labelText: '端口',
                            prefixIcon: Icon(Icons.numbers),
                          ),
                          keyboardType: TextInputType.number,
                          validator: (v) =>
                              v == null || v.isEmpty ? '请输入端口' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _userCtrl,
                    decoration: const InputDecoration(
                      labelText: '用户名',
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (v) =>
                        v == null || v.isEmpty ? '请输入用户名' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _pwdCtrl,
                    decoration: InputDecoration(
                      labelText: '密码',
                      prefixIcon: const Icon(Icons.lock),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    obscureText: _obscure,
                    validator: (v) =>
                        v == null || v.isEmpty ? '请输入密码' : null,
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: _testing ? null : _testConnection,
                        icon: _testing
                            ? const SizedBox(
                                width: 16, height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.wifi_tethering),
                        label: const Text('测试连接'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton.icon(
                        onPressed: _saving ? null : _save,
                        icon: _saving
                            ? const SizedBox(
                                width: 16, height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.save),
                        label: Text(_saving ? '保存中...' : '保存'),
                      ),
                    ],
                  ),
                  if (_testResult != null) ...[
                    const SizedBox(height: 24),
                    _buildTestResult(),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// 测试成功后显示系统信息
  Widget _buildTestResult() {
    final r = _testResult!;
    if (!r.success) {
      return Card(
        child: ListTile(
          leading: const Icon(Icons.error, color: Colors.red),
          title: const Text('连接失败'),
          subtitle: Text(r.message),
        ),
      );
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Icon(Icons.check_circle, color: Colors.green),
              const SizedBox(width: 8),
              Text('连接成功', style: Theme.of(context).textTheme.titleMedium),
            ]),
            const Divider(height: 24),
            if (r.osInfo != null) _infoRow('操作系统', r.osInfo!),
            if (r.cpuCores != null) _infoRow('CPU', '${r.cpuCores} 核'),
            if (r.memoryMB != null) _infoRow('内存', '${(r.memoryMB! / 1024).toStringAsFixed(1)} GB'),
            if (r.diskGB != null) _infoRow('磁盘', '${r.diskGB} GB'),
            _infoRow('Docker', r.dockerInstalled
                ? '${r.dockerVersion ?? '已安装'}'
                : '未安装'),
            _infoRow('Caddy', r.caddyInstalled ? '已安装' : '未安装'),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(width: 80, child: Text(label, style: Theme.of(context).textTheme.bodySmall)),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }
}
