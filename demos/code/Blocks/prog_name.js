Blockly.Blocks['prog_name'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("PROGRAM")
      .appendField(new Blockly.FieldTextInput("prog_name"), "prog_name");
    this.appendDummyInput();
    this.appendStatementInput("translator directives")
      .setCheck("Directives")
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField("Directives");
    this.appendStatementInput("declarations")
      .setCheck("Declarations")
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField("Declarations");
    this.appendStatementInput("routines")
      .setCheck("Routines")
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField("Routines");
    this.appendDummyInput();
    this.appendStatementInput("BEGIN")
      .setCheck(null)
      .appendField("BEGIN");
    this.appendDummyInput()
      .appendField("END");
    this.setInputsInline(false);
    this.setNextStatement(true, "Routines");
    this.setColour(240);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.KAREL['prog_name'] = function(block) {
  var text_prog_name = block.getFieldValue('prog_name');
  var statements_translator_directives = Blockly.JavaScript.statementToCode(block, 'translator directives');
  var statements_declarations = Blockly.JavaScript.statementToCode(block, 'declarations');
  var statements_routines = Blockly.JavaScript.statementToCode(block, 'routines');
  var statements_begin = Blockly.JavaScript.statementToCode(block, 'BEGIN');
  // TODO: Assemble KAREL into code variable.
  var code = 'PROGRAM ' + text_prog_name + '\n';

  if (statements_translator_directives) {
    code += statements_translator_directives;
  }
  if (statements_declarations) {
    code += statements_declarations;
  }
  if (statements_routines) {
    code += statements_routines;
  }

  code += 'BEGIN' + '\n' +statements_begin + '\n' + 'END ' + text_prog_name + '\n';
  return code;
};
