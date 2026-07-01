// ignore_for_file: directives_ordering

import 'package:freezed_annotation/freezed_annotation.dart';

part 'template.freezed.dart';
part 'template.g.dart';

/// 模板问题类型枚举（对应 shared/types/template.ts QuestionType）
enum QuestionType {
  @JsonValue('text')
  text,
  @JsonValue('textarea')
  textarea,
  @JsonValue('select')
  select,
  @JsonValue('multi-select')
  multiSelect,
  @JsonValue('color-select')
  colorSelect,
  @JsonValue('time-range')
  timeRange,
  @JsonValue('number')
  number,
  @JsonValue('image')
  image,
}

/// 模板问题选项值（字符串或 label/value 对象）
@freezed
class TemplateOption with _$TemplateOption {
  const factory TemplateOption.labelValue({
    required String label,
    required String value,
  }) = _TemplateOptionLabelValue;

  const factory TemplateOption.plain(String value) = _TemplateOptionPlain;

  factory TemplateOption.fromJson(Map<String, dynamic> json) =>
      _$TemplateOptionFromJson(json);
}

/// 模板问题模型（对应 shared/types/template.ts TemplateQuestion）
@freezed
class TemplateQuestion with _$TemplateQuestion {
  const factory TemplateQuestion({
    required String id,
    required String question,
    required QuestionType type,
    @Default(true) bool required,
    String? placeholder,
    @JsonKey(name: 'default') Object? defaultValue,
    List<TemplateOption>? options,
  }) = _TemplateQuestion;

  factory TemplateQuestion.fromJson(Map<String, dynamic> json) =>
      _$TemplateQuestionFromJson(json);
}

/// 模板元数据模型（对应 shared/types/template.ts Template）
@freezed
class Template with _$Template {
  const factory Template({
    required String id,
    required String name,
    required String description,
    required String architecture,
    @Default('1.0.0') String version,
    @Default(<String>[]) List<String> features,
    @Default(<String>[]) List<String> screenshots,
    @Default(<TemplateQuestion>[]) List<TemplateQuestion> questions,
    @Default(<String, String>{}) Map<String, String> configMapping,
  }) = _Template;

  factory Template.fromJson(Map<String, dynamic> json) =>
      _$TemplateFromJson(json);
}

/// 模板列表项模型（对应 shared/types/template.ts TemplateListItem）
@freezed
class TemplateListItem with _$TemplateListItem {
  const factory TemplateListItem({
    required String id,
    required String type,
    required String name,
    required String description,
    required String version,
    @Default(<String>[]) List<String> features,
    @Default(false) bool isActive,
  }) = _TemplateListItem;

  factory TemplateListItem.fromJson(Map<String, dynamic> json) =>
      _$TemplateListItemFromJson(json);
}
