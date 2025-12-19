module.exports = grammar({
    name: 'tarmac',
    extras: $ => [
        / |\t|\r/,
        $.line_comment,
        $.block_comment,
    ],
    conflicts: $ => [
        [
            $._expr,
            $._tc_expr,
        ],
        [
            $.tarmac_trace,
            $._tarmac_prefix_token,
        ],
    ],

    rules: {
        program: $ => sep(repeat1('\n'), $._item),
        _item: $ =>
            choice(
                $.tarmac_trace,
                $.meta,
                $.label,
                $.const,
                $.instruction,
                $.testcase,
                $.warning_messages,
            ),

        meta: $ =>
            seq(
                field('kind', $.meta_ident),
                optional(choice(
                    $.ident,
                    seq($.int, repeat(seq(',', $.int))),
                    seq($.float, repeat(seq(',', $.float))),
                    seq($.string, repeat(seq(',', $.string))),
                )),
            ),
        label: $ =>
            choice(
                seq(
                    choice($.meta_ident, alias($.word, $.ident), alias($._ident, $.ident)),
                    ':',
                    optional(choice(seq('(', $.ident, ')'), $.meta)),
                ),
                seq(
                    'label',
                    field('name', $.word),
                ),
            ),
        const: $ => seq('const', field('name', $.word), field('value', $._tc_expr)),
        testcase: $ =>
            seq(
                '**',
                field('name', repeat1(choice($.word, ':'))),
                '**',
            ),
        instruction: $ =>
            seq(
                field('kind', $.word),
                choice(sep(',', $._expr), repeat($._tc_expr)),
            ),

        warning_messages: $ =>
            token(/Warning: [^\n]*/),

        // Tarmac trace lines
        tarmac_trace: $ =>
            choice(
                // Full trace line with decoded instruction after ':'
                // Give this higher precedence so it wins over the
                // generic fallback when there is a decoded instruction.
                prec(1, seq(
                    field('cycle', $.int),
                    'clk',
                    repeat1($._tarmac_prefix_token),
                    ' : ',
                    field('actual_instruction', $.instruction),
                )),
                // Simple trace line: cycle, kind, name, value
                seq(
                    field('cycle', $.int),
                    'clk',
                    field('kind', choice($.word, $.int)),
                    field('name', $.word),
                    field('value', $.int),
                ),
                // Trace with explicit regtype and string value
                seq(
                    field('cycle', $.int),
                    'clk',
                    field('kind', $.word),
                    field('regtype', $.word),
                    field('name', $.word),
                    field('value', $.string),
                ),
                seq(
                    field('cycle', $.int),
                    'clk',
                    field('possiblekind', $.int),
                    field('regtype', $.word),
                    field('name', $.word),
                    field('value', $.string),
                ),
                // Trace line with dotted register space
                seq(
                    field('cycle', $.int),
                    'clk',
                    field('regtype', $.delimitedword),
                    field('kind', $.word),
                    field('name', $.word),
                    field('value', $.int),
                ),
                // Colon-separated value range
                seq(
                    field('cycle', $.int),
                    'clk',
                    field('kind', choice($.word, $.int)),
                    field('op', $.word),
                    field('scope', $.word),
                    field('value_lo', $.int),
                    ':',
                    field('value_hi', $.int),
                ),
                // S1POE2 style range with address and code
                seq(
                    field('cycle', $.int),
                    'clk',
                    field('kind', $.word),
                    field('op', $.word),
                    field('value_lo', $.int),
                    ':',
                    field('addr', $.word),
                    field('code', $.int),
                ),
                // abort line
                seq(
                    field('cycle', $.int),
                    'clk',
                    field('kind', $.word),
                    optional(field('op', $.word)),
                    field('addr', $.int),
                    '(',
                    field('status', $.word),
                    ')',
                ),
                // Signal/state
                seq(
                    field('cycle', $.int),
                    'clk',
                    'SIGNAL',
                  ':',
                  'SIGNAL',
                  '=',
                  field('signal', $.word),
                  'STATE',
                  '=',
                  field('state', $.word),
                ),
                // CoreEvent changes
                seq(
                    field('cycle', $.int),
                    'clk',
                    field('kind', choice($.word, $.int)),
                    field('pc', $.int),
                    ':',
                    field('addr', $.word),
                    optional(field('el', $.word)), // EL3h (may be absent)
                    field('code', $.int),
                    field('event', $.word),
                ),

                // Fallback: any line starting with cycle + 'clk'
                // that did not match a more specific shape.
                // Very low precedence so other patterns win.
                prec(-1, seq(
                    field('cycle', $.int),
                    'clk',
                    repeat($._tarmac_prefix_token),
                )),

            ),

        _tarmac_prefix_token: $ =>
            choice(
                $.word,
                $.int,
                $.string,
                $.float,
                '(',
                ')',
            ),

        _expr: $ => choice($.ptr, $.ident, $.int, $.string, $.float, $.list),

        // ARMv7
        list: $ =>
            seq(
                '{',
                optional(seq($.reg, repeat(seq(choice(',', '-'), $.reg)), optional(','))),
                '}'
            ),

        ptr: $ =>
            choice(
                seq(
                    optional(seq(choice('byte', 'word', 'dword', 'qword'), 'ptr')),
                    '[',
                    $.reg,
                    optional(seq(choice('+', '-'), choice($.int, $.ident))),
                    ']',
                ),
                seq(
                    optional($.int),
                    '(',
                    $.reg,
                    ')',
                ),
                seq(
                    '*',
                    'rel',
                    '[',
                    $.int,
                    ']',
                ),
                // Aarch64
                seq(
                    '[',
                    $.reg,
                    optional(seq(',', $.int)),
                    ']',
                    optional('!'),
                ),
            ),
        // Turing Complete
        _tc_expr: $ =>
            choice(
                $.ident,
                $.int,
                $.string,
                $.tc_infix,
            ),
        tc_infix: $ =>
            choice(
                ...[
                    ['+', 0],
                    ['-', 0],
                    ['*', 1],
                    ['/', 1],
                    ['%', 1],
                    ['|', 2],
                    ['^', 3],
                    ['&', 4],
                ].map(([op, p]) =>
                    prec.left(
                        p,
                        seq(field('lhs', $._tc_expr), field('op', op), field('rhs', $._tc_expr)),
                    )
                ),
            ),

        int: $ => {
            const _int = /-?([0-9][0-9_]*|[0-9A-Fa-f][0-9A-Fa-f_]*|(0x|\$)[0-9A-Fa-f][0-9A-Fa-f_]*|0b[01][01_]*)/
            return choice(
                seq('#', token.immediate(_int)),
                _int,
            )
        },
        float: $ => /-?[0-9][0-9_]*\.([0-9][0-9_]*)?/,
        string: $ =>
            choice(
                /"[^"]*"/,
                /'[^']*'/
	    ),

        word: $ => /[a-zA-Z0-9_]+/,
        delimitedword: $ => /[a-zA-Z0-9_.]+/,
        _reg: $ => /%?[a-z0-9]+/,
        address: $ => /[=\$][a-zA-Z0-9_]+/, // GAS x86 address
        reg: $ => choice($._reg, $.word, $.address),
        meta_ident: $ => /\.[a-z_]+/,
        _ident: $ => /[a-zA-Z_0-9.]+/,
        ident: $ => choice($._ident, $.meta_ident, $.reg),

        line_comment: $ =>
            choice(
                seq('#', token.immediate(/.*/)),
                /(\/\/|;).*/,
            ),
        block_comment: $ =>
            token(seq(
                '/*',
                /[^*]*\*+([^/*][^*]*\*+)*/,
                '/',
            )),
    },
})

function sep(separator, rule) {
    return optional(seq(rule, repeat(seq(separator, rule)), optional(separator)))
}
