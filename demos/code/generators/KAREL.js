/**
 * @license
 * Copyright 2014 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Helper functions for generating KAREL for blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.KAREL');

goog.require('Blockly.Generator');
goog.require('Blockly.utils.string');

/**
 * KAREL code generator.
 * @type {!Blockly.Generator}
 */
Blockly.KAREL = new Blockly.Generator('KAREL');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
 Blockly.KAREL.addReservedWords(

	// FANUC America Corporation SYSTEM R-30iA and R-30iB
	// Controller KAREL Reference Manual
    'ABORT,CONST,GET_VAR,NOPAUSE,STOP,' +
	'ABOUT,CONTINUE,GO,NOT,STRING,' +
	'ABS,COORDINATED,GOTO,NOWAIT,STRUCTURE,' +
	'AFTER,CR,GROUP,OF,THEN,' +
	'ALONG,DELAY,GROUP_ASSOC,OPEN,TIME,' +
	'ALSO,DISABLE,HAND,OR,TIMER,' +
	'AND,DISCONNECT,HOLD,PATH,TO,' +
	'ARRAY,DIV,IF,PATHHEADER,TPENABLE,' +
	'ARRAY_LEN,DO,IN,PAUSE,TYPE,' +
	'AT,DOWNTO,INDEPENDENT,POSITION,UNHOLD,' +
	'ATTACH,DRAM,INTEGER,POWERUP,UNINIT,' +
	'AWAY,ELSE,JOINTPOS,PROGRAM,UNPAUSE,' +
	'AXIS,ENABLE,JOINTPOS1,PULSE,UNTIL,' +
	'BEFORE,END,JOINTPOS2,PURGE,USING,' +
	'BEGIN,ENDCONDITION,JOINTPOS3,READ,VAR,' +
	'BOOLEAN,ENDFOR,JOINTPOS4,REAL,VECTOR,' +
	'BY,ENDIF,JOINTPOS5,RELATIVE,VIA,' +
	'BYNAME,ENDMOVE,JOINTPOS6,RELAX,VIS_PROCESS,' +
	'BYTE,ENDSELECT,JOINTPOS7,RELEASE,WAIT,' +
	'CAM_SETUP,ENDSTRUCTURE,JOINTPOS8,REPEAT,WHEN,' +
	'CANCEL,ENDUSING,JOINTPOS9,RESTORE,WHILE,' +
	'CASE,ENDWHILE,MOD,RESUME,WITH,' +
	'CLOSE,ERROR,MODEL,RETURN,WRITE,' +
	'CMOS,EVAL,MOVE,ROUTINE,XYZWPR,' +
	'COMMAND,EVENT,NEAR,SELECT,XYZWPREXT,' +
	'COMMON_ASSOC,END,NOABORT,SEMAPHORE,' +
	'CONDITION,FILE,NODE,SET_VAR,' +
	'CONFIG,FOR,NODEDATA,SHORT,' +
	'CONNECT,FROM,NOMESSAGE,SIGNAL'
);

/**
 * Order of operation ENUMs.
 * https://www.dartlang.org/docs/dart-up-and-runn
 */
Blockly.KAREL.ORDER_ATOMIC = 0;              // literals
Blockly.KAREL.ORDER_NOT = 1;               // not operation
Blockly.KAREL.ORDER_SPECIAL = 2;           // :, @, #
Blockly.KAREL.ORDER_UPPER_ARITHMATIC = 3;  // *, /, AND, DIV, MOD
Blockly.KAREL.ORDER_LOWER_ARITHMATIC = 4;  // Unary + and -, OR, +, -
Blockly.KAREL.ORDER_RELATIONAL = 5;        // <, >, =, < >, < =, > =, > = <
Blockly.KAREL.ORDER_NONE = 99;

/**
 * List of outer-inner pairings that do NOT require parentheses.
 * @type {!Array.<!Array.<number>>}
 */
Blockly.KAREL.ORDER_OVERRIDES = [
	// (foo()).bar -> foo().bar
	// (foo())[0] -> foo()[0]
	[Blockly.KAREL.ORDER_FUNCTION_CALL, Blockly.KAREL.ORDER_MEMBER],
	// (foo())() -> foo()()
	[Blockly.KAREL.ORDER_FUNCTION_CALL, Blockly.KAREL.ORDER_FUNCTION_CALL],
	// (foo.bar).baz -> foo.bar.baz
	// (foo.bar)[0] -> foo.bar[0]
	// (foo[0]).bar -> foo[0].bar
	// (foo[0])[1] -> foo[0][1]
	[Blockly.KAREL.ORDER_MEMBER, Blockly.KAREL.ORDER_MEMBER],
	// (foo.bar)() -> foo.bar()
	// (foo[0])() -> foo[0]()
	[Blockly.KAREL.ORDER_MEMBER, Blockly.KAREL.ORDER_FUNCTION_CALL],

	// !(!foo) -> !!foo
	[Blockly.KAREL.ORDER_LOGICAL_NOT, Blockly.KAREL.ORDER_LOGICAL_NOT],
	// a * (b * c) -> a * b * c
	[Blockly.KAREL.ORDER_MULTIPLICATION, Blockly.KAREL.ORDER_MULTIPLICATION],
	// a + (b + c) -> a + b + c
	[Blockly.KAREL.ORDER_ADDITION, Blockly.KAREL.ORDER_ADDITION],
	// a && (b && c) -> a && b && c
	[Blockly.KAREL.ORDER_LOGICAL_AND, Blockly.KAREL.ORDER_LOGICAL_AND],
	// a || (b || c) -> a || b || c
	[Blockly.KAREL.ORDER_LOGICAL_OR, Blockly.KAREL.ORDER_LOGICAL_OR]
];

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.KAREL.init = function(workspace) {
	// Create a dictionary of definitions to be printed before the code.
	Blockly.KAREL.definitions_ = Object.create(null);
	// Create a dictionary mapping desired function names in definitions_
	// to actual function names (to avoid collisions with user functions).
	Blockly.KAREL.functionNames_ = Object.create(null);

	if (!Blockly.KAREL.variableDB_) {
		Blockly.KAREL.variableDB_ =
			new Blockly.Names(Blockly.KAREL.RESERVED_WORDS_);
	} else {
		Blockly.KAREL.variableDB_.reset();
	}

	Blockly.KAREL.variableDB_.setVariableMap(workspace.getVariableMap());

	var defvars = [];
	// Add developer variables (not created or named by the user).
	var devVarList = Blockly.Variables.allDeveloperVariables(workspace);
	for (var i = 0; i < devVarList.length; i++) {
		defvars.push(Blockly.KAREL.variableDB_.getName(devVarList[i],
			Blockly.Names.DEVELOPER_VARIABLE_TYPE));
	}

	// Add user variables, but only ones that are being used.
	var variables = Blockly.Variables.allUsedVarModels(workspace);
	for (var i = 0; i < variables.length; i++) {
		defvars.push(Blockly.KAREL.variableDB_.getName(variables[i].getId(),
			Blockly.Variables.NAME_TYPE));
	}

	// Declare all of the variables.
	if (defvars.length) {
		Blockly.KAREL.definitions_['variables'] =
			'var ' + defvars.join(', ') + ';';
	}
};


/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.KAREL.finish = function(code) {
	// Convert the definitions dictionary into a list.
	var definitions = [];
	for (var name in Blockly.KAREL.definitions_) {
		definitions.push(Blockly.KAREL.definitions_[name]);
	}
	// Clean up temporary data.
	delete Blockly.KAREL.definitions_;
	delete Blockly.KAREL.functionNames_;
	Blockly.KAREL.variableDB_.reset();
	return definitions.join('\n') + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.KAREL.scrubNakedValue = function(line) {
	return line + '\n';
};

/**
 * Encode a string as a properly escaped KAREL string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} KAREL string.
 * @private
 */
Blockly.KAREL.quote_ = function(string) {
	// Can't use goog.string.quote since Google's style guide recommends
	// JS string literals use single quotes.
	string = string.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\\n')
		.replace(/'/g, '\\\'');
	return '\'' + string + '\'';
};

/**
 * Encode a string as a properly escaped multiline KAREL string, complete
 * with quotes.
 * @param {string} string Text to encode.
 * @return {string} KAREL string.
 * @private
 */
Blockly.KAREL.multiline_quote_ = function(string) {
	// Can't use goog.string.quote since Google's style guide recommends
	// JS string literals use single quotes.
	var lines = string.split(/\n/g).map(Blockly.KAREL.quote_);
	return lines.join(' + \'\\n\' +\n');
};

/**
 * Common tasks for generating KAREL from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The KAREL code created for this block.
 * @param {boolean=} opt_thisOnly True to generate code for only this statement.
 * @return {string} KAREL code with comments and subsequent blocks added.
 * @private
 */
Blockly.KAREL.scrub_ = function(block, code, opt_thisOnly) {
	var commentCode = '';
	// Only collect comments for blocks that aren't inline.
	if (!block.outputConnection || !block.outputConnection.targetConnection) {
		// Collect comment for this block.
		var comment = block.getCommentText();
		if (comment) {
			comment = Blockly.utils.string.wrap(comment,
				Blockly.KAREL.COMMENT_WRAP - 3);
			commentCode += Blockly.KAREL.prefixLines(comment + '\n', '// ');
		}
		// Collect comments for all value arguments.
		// Don't collect comments for nested statements.
		for (var i = 0; i < block.inputList.length; i++) {
			if (block.inputList[i].type == Blockly.INPUT_VALUE) {
				var childBlock = block.inputList[i].connection.targetBlock();
				if (childBlock) {
					var comment = Blockly.KAREL.allNestedComments(childBlock);
					if (comment) {
						commentCode += Blockly.KAREL.prefixLines(comment, '// ');
					}
				}
			}
		}
	}
	var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
	var nextCode = opt_thisOnly ? '' : Blockly.KAREL.blockToCode(nextBlock);
	return commentCode + code + nextCode;
};

/**
 * Gets a property and adjusts the value while taking into account indexing.
 * @param {!Blockly.Block} block The block.
 * @param {string} atId The property ID of the element to get.
 * @param {number=} opt_delta Value to add.
 * @param {boolean=} opt_negate Whether to negate the value.
 * @param {number=} opt_order The highest order acting on this value.
 * @return {string|number}
 */
Blockly.KAREL.getAdjusted = function(block, atId, opt_delta, opt_negate,
	opt_order) {
	var delta = opt_delta || 0;
	var order = opt_order || Blockly.KAREL.ORDER_NONE;
	if (block.workspace.options.oneBasedIndex) {
		delta--;
	}
	var defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
	if (delta > 0) {
		var at = Blockly.KAREL.valueToCode(block, atId,
			Blockly.KAREL.ORDER_ADDITION) || defaultAtIndex;
	} else if (delta < 0) {
		var at = Blockly.KAREL.valueToCode(block, atId,
			Blockly.KAREL.ORDER_SUBTRACTION) || defaultAtIndex;
	} else if (opt_negate) {
		var at = Blockly.KAREL.valueToCode(block, atId,
			Blockly.KAREL.ORDER_UNARY_NEGATION) || defaultAtIndex;
	} else {
		var at = Blockly.KAREL.valueToCode(block, atId, order) ||
			defaultAtIndex;
	}

	if (Blockly.isNumber(at)) {
		// If the index is a naked number, adjust it right now.
		at = Number(at) + delta;
		if (opt_negate) {
			at = -at;
		}
	} else {
		// If the index is dynamic, adjust it in code.
		if (delta > 0) {
			at = at + ' + ' + delta;
			var innerOrder = Blockly.KAREL.ORDER_ADDITION;
		} else if (delta < 0) {
			at = at + ' - ' + -delta;
			var innerOrder = Blockly.KAREL.ORDER_SUBTRACTION;
		}
		if (opt_negate) {
			if (delta) {
				at = '-(' + at + ')';
			} else {
				at = '-' + at;
			}
			var innerOrder = Blockly.KAREL.ORDER_UNARY_NEGATION;
		}
		innerOrder = Math.floor(innerOrder);
		order = Math.floor(order);
		if (innerOrder && order >= innerOrder) {
			at = '(' + at + ')';
		}
	}
	return at;
};


