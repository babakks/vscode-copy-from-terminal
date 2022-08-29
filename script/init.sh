EXTENSION_INSTANCE_ID="$1"
COPY_TO_VSCODE_TEMP_DIR="$2/"
cp_alias="$3"
tee_alias="$4"

_get_temp_file() {
    dt="$(date --iso-8601=ns)"
    tempfname="$dt-$EXTENSION_INSTANCE_ID.tmp"
    echo "$COPY_TO_VSCODE_TEMP_DIR/$tempfname"
}
_cp2code() { cat > "$(_get_temp_file)"; }
_tee2code() { tee "$(_get_temp_file)"; }

alias "${cp_alias}=_cp2code"
alias "${tee_alias}=_tee2code"
