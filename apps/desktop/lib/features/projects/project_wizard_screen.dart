// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/models/product_type.dart';
import 'package:flutter_core/models/project.dart';
import 'package:flutter_core/state/providers.dart';

/// 项目创建向导
///
/// - Step 1: 选择产品类型（6 个卡片网格）
/// - Step 2: 输入项目名 + 选择服务器
/// - Step 3: AI 对话需求澄清（占位）
/// - Step 4: 确认创建
class ProjectWizardScreen extends ConsumerStatefulWidget {
  const ProjectWizardScreen({super.key});

  @override
  ConsumerState<ProjectWizardScreen> createState() => _ProjectWizardScreenState();
}

class _ProjectWizardScreenState extends ConsumerState<ProjectWizardScreen> {
  int _currentStep = 0;
  ProjectType? _selectedType;
  final _nameCtrl = TextEditingController();
  String? _selectedServerId;
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(serverListNotifierProvider.notifier).refresh());
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.go('/projects'),
        ),
        title: const Text('新建项目'),
      ),
      body: Stepper(
        currentStep: _currentStep,
        onStepContinue: _onContinue,
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep -= 1);
          } else {
            context.go('/projects');
          }
        },
        onStepTapped: (index) => setState(() => _currentStep = index),
        controlsBuilder: (context, details) {
          return Row(
            children: [
              FilledButton(onPressed: details.onStepContinue, child: Text(_nextLabel())),
              const SizedBox(width: 8),
              TextButton(onPressed: details.onStepCancel, child: const Text('返回')),
            ],
          );
        },
        steps: [
          Step(
            title: const Text('选择产品类型'),
            content: _buildTypeSelection(),
            isActive: _currentStep >= 0,
            state: _selectedType != null && _currentStep > 0
                ? StepState.complete
                : StepState.indexed,
          ),
          Step(
            title: const Text('项目信息'),
            content: _buildProjectInfo(),
            isActive: _currentStep >= 1,
          ),
          Step(
            title: const Text('AI 需求澄清'),
            content: _buildAiClarify(),
            isActive: _currentStep >= 2,
          ),
          Step(
            title: const Text('确认创建'),
            content: _buildConfirm(),
            isActive: _currentStep >= 3,
          ),
        ],
      ),
    );
  }

  String _nextLabel() {
    if (_currentStep == 3) return _creating ? '创建中...' : '创建';
    return '下一步';
  }

  // Step 1: 选择产品类型
  Widget _buildTypeSelection() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 2.2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: productTypes.length,
      itemBuilder: (context, index) {
        final meta = productTypes[index];
        final selected = _selectedType == meta.id;
        return Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: selected
                ? BorderSide(color: meta.themeColor, width: 2)
                : BorderSide.none,
          ),
          child: InkWell(
            onTap: () => setState(() => _selectedType = meta.id),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: meta.themeColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(meta.iconData, color: meta.themeColor, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(meta.name,
                            style: Theme.of(context).textTheme.titleMedium,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text(meta.description,
                            style: Theme.of(context).textTheme.bodySmall,
                            maxLines: 2, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // Step 2: 项目信息
  Widget _buildProjectInfo() {
    final serverState = ref.watch(serverListNotifierProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _nameCtrl,
          decoration: const InputDecoration(
            labelText: '项目名称',
            hintText: '输入你的产品名称',
            prefixIcon: Icon(Icons.text_fields),
          ),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _selectedServerId,
          decoration: const InputDecoration(
            labelText: '部署服务器',
            prefixIcon: Icon(Icons.dns),
          ),
          items: serverState.items
              .map((s) => DropdownMenuItem(
                    value: s.id,
                    child: Text('${s.name} (${s.ip})'),
                  ))
              .toList(),
          onChanged: (v) => setState(() => _selectedServerId = v),
          hint: const Text('选择目标服务器'),
        ),
        if (serverState.items.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: TextButton.icon(
              onPressed: () => context.go('/servers/new'),
              icon: const Icon(Icons.add),
              label: const Text('先添加服务器'),
            ),
          ),
      ],
    );
  }

  // Step 3: AI 需求澄清（占位）
  Widget _buildAiClarify() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('AI 助手将根据你的产品类型自动澄清需求'),
        SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: Icon(Icons.smart_toy, color: Colors.grey),
            title: Text('AI 需求澄清待接入'),
            subtitle: Text('Week 1 占位实现，后续接入 Lynx AI Agent'),
          ),
        ),
      ],
    );
  }

  // Step 4: 确认创建
  Widget _buildConfirm() {
    final meta = _selectedType != null ? getProductTypeMeta(_selectedType!) : null;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ConfirmRow(label: '产品类型', value: meta?.name ?? '-'),
            _ConfirmRow(label: '项目名称', value: _nameCtrl.text.isEmpty ? '-' : _nameCtrl.text),
            _ConfirmRow(
              label: '服务器',
              value: _selectedServerId != null ? '已选择' : '未选择',
            ),
          ],
        ),
      ),
    );
  }

  void _onContinue() async {
    if (_currentStep < 3) {
      // 校验当前步骤
      if (_currentStep == 0 && _selectedType == null) {
        _toast('请选择产品类型');
        return;
      }
      if (_currentStep == 1) {
        if (_nameCtrl.text.isEmpty) {
          _toast('请输入项目名称');
          return;
        }
        if (_selectedServerId == null) {
          _toast('请选择服务器');
          return;
        }
      }
      setState(() => _currentStep += 1);
      return;
    }

    // 创建项目
    setState(() => _creating = true);
    try {
      final project = await ref.read(projectServiceProvider).create(
            _nameCtrl.text.trim(),
            _selectedType!,
            _selectedServerId!,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('项目 ${project.name} 创建成功')),
        );
        context.go('/projects/${project.id}');
      }
    } catch (e) {
      if (mounted) {
        _toast('创建失败：$e');
      }
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }
}

class _ConfirmRow extends StatelessWidget {
  const _ConfirmRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 80, child: Text(label, style: Theme.of(context).textTheme.bodySmall)),
          Expanded(child: Text(value, style: Theme.of(context).textTheme.titleMedium)),
        ],
      ),
    );
  }
}
