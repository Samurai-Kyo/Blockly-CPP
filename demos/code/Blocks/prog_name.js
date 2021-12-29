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
      .appendField("END")
      .appendField(new Blockly.FieldTextInput("prog_name"), "prog_name");
    this.setInputsInline(false);
    this.setNextStatement(true, "Routines");
    this.setColour(240);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['prog_name'] = function(block) {
  var text_prog_name = block.getFieldValue('prog_name');
  var statements_translator_directives = Blockly.JavaScript.statementToCode(block, 'translator directives');
  var statements_declarations = Blockly.JavaScript.statementToCode(block, 'declarations');
  var statements_routines = Blockly.JavaScript.statementToCode(block, 'routines');
  var statements_begin = Blockly.JavaScript.statementToCode(block, 'BEGIN');
  var text_prog_name = block.getFieldValue('prog_name');
  // TODO: Assemble JavaScript into code variable.
  var code = '...;\n';
  return code;
};
