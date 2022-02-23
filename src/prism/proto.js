(function (Prism) {
    Prism.languages.proto = {
        'comment': /#.*/g,
        'message': {
            pattern: /\w+(?=[ \t]+{)/g,
            alias: 'function'
        },
        'variable': /(?<=[ \t])\w+(?=:)/g,
        'property': {
            pattern: /(?<=: +).*/g,
            alias: 'selector'
        }
    }
}(Prism));