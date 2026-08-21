package com.focusguard.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(FocusGuardPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
