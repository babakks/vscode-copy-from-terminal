EXTENSION_INSTANCE_ID="$1"
COPY_TO_VSCODE_TEMP_DIR="$2/"
cp_alias="$3"
tee_alias="$4"

_get_temp_file() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        dt="$(date --iso-8601=ns)"
    else
        if which bash > /dev/null; then
            _r="$(bash -c 'echo $RANDOM')"
        else
            _r="$RANDOM"
        fi
        dt="$(date +%s)-$_r"
    fi
    tempfname="$dt-$EXTENSION_INSTANCE_ID.tmp"
    echo "$COPY_TO_VSCODE_TEMP_DIR/$tempfname"
}
_cp2code() { cat > "$(_get_temp_file)"; }
_tee2code() { tee "$(_get_temp_file)"; }

alias "${cp_alias}=_cp2code"
alias "${tee_alias}=_tee2code"
