"""03E-only fixed host profile. No provider fallback or independent network access."""
import importlib.util
from pathlib import Path

# Execute the accepted adapter with its socket guard installed before importing yfinance.
spec = importlib.util.spec_from_file_location('botsquad_yahoo_adapter', Path(__file__).with_name('adapter.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.HISTORY_QUERY1_ONLY = True
try:
    module.main()
except module.GatewayStop as error:
    module.emit({'type': 'error', 'code': str(error)})
    raise SystemExit(1)
except BaseException:
    module.emit({'type': 'error', 'code': 'python_adapter_failure'})
    raise SystemExit(1)
