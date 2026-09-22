package com.anvimitra.erp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppUpdateInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

