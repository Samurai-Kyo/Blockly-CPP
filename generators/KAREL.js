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
 Blockly.C.addReservedWords(
    
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
// TODO Add Precitence
// Highest
// NOT
// :, @, # ↓
// *, /, AND, DIV, MOD ↓
// Unary + and -, OR, +, - ↓
// <, >, =, < >, < =, > =, > = < 
// Lowest

 